import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { prisma } from './db.js';
import { PORT } from './env.js';
import router from './routes/index.js';
import { nightlyBatch } from './services/nightlyBatch.js';
const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));
// Liveness: process is up
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
// Readiness/DB: check Prisma/Postgres connectivity
app.get('/dbhealth', async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: String(e) });
    }
});
app.use('/api', router);
app.listen(PORT, () => {
    console.log(`✅ API listening on http://localhost:${PORT}`);
    // Start the nightly batch service
    nightlyBatch.start();
    console.log('🌙 Nightly batch service started');
});
