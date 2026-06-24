import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8081),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/polymarket_signal_lab'),
  REDIS_URL: z.string().optional(),
  DATA_MODE: z.enum(['mock', 'live']).default('mock'),
  POLYMARKET_GAMMA_BASE_URL: z.string().default('https://gamma-api.polymarket.com'),
  POLYMARKET_DATA_BASE_URL: z.string().default('https://data-api.polymarket.com'),
  POLYMARKET_CLOB_BASE_URL: z.string().default('https://clob.polymarket.com'),
  TELEGRAM_ENABLED: z.coerce.boolean().default(false),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  WORKER_ENABLED: z.coerce.boolean().default(true),
  WORKER_INTERVAL_SECONDS: z.coerce.number().default(60),
});

export const env = envSchema.parse(process.env);
