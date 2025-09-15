import { Router } from 'express';
import { prisma } from '../db.js';
import { OPENAI_API_KEY } from '../env.js';
import { z } from 'zod';
import pkg from 'openai';
const { OpenAI } = pkg;

const router = Router();
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function chunkText(text: string, maxChars = 3500): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + maxChars);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

router.post('/upsert', async (req, res) => {
  const body = z.object({
    orgId: z.string(),
    sourceType: z.enum(['standup_session','meeting','doc']),
    sourceId: z.string(),
    text: z.string().min(1)
  }).parse(req.body);

  if (!openai) return res.status(400).json({ error: 'OPENAI_API_KEY not set' });

  const chunks = chunkText(body.text);

  const { data } = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: chunks
  });

  for (let i = 0; i < data.length; i++) {
    const vec = '[' + data[i].embedding.map(n => Number(n).toFixed(6)).join(',') + ']';
    await prisma.$executeRawUnsafe(
      `INSERT INTO rag_documents (org_id, source_type, source_id, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4, $5, $6::vector)`,
      body.orgId, body.sourceType, body.sourceId, i, chunks[i], vec
    );
  }

  res.json({ ok: true, chunks: data.length });
});

router.post('/query', async (req, res) => {
  const body = z.object({
    orgId: z.string(),
    query: z.string(),
    topK: z.number().int().min(1).max(20).default(5)
  }).parse(req.body);

  if (!openai) return res.status(400).json({ error: 'OPENAI_API_KEY not set' });

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: body.query
  }).then(r => r.data[0].embedding);

  const vec = '[' + embedding.map((n: number) => Number(n).toFixed(6)).join(',') + ']';

  const results: any = await prisma.$queryRawUnsafe(`
    SELECT id, source_type, source_id, chunk_index, content,
           1 - (embedding <=> $1::vector) AS score
    FROM rag_documents
    WHERE org_id = $2
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `, vec, body.orgId, body.topK);

  res.json({ results });
});

export default router;
