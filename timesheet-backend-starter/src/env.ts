import 'dotenv/config';

export const PORT = parseInt(process.env.PORT || '4000', 10);
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';

if (!DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set. Prisma will fail to connect.');
}
