CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        text NOT NULL,
  source_type   text NOT NULL,
  source_id     text NOT NULL,
  chunk_index   int NOT NULL,
  content       text NOT NULL,
  embedding     vector(1536),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_org ON rag_documents (org_id);
CREATE INDEX IF NOT EXISTS idx_rag_source ON rag_documents (source_type, source_id);

DO $$ BEGIN
  CREATE INDEX idx_rag_embedding ON rag_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
EXCEPTION WHEN others THEN
  NULL;
END $$;
