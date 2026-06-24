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
  POLYMARKET_WEBSOCKET_ENABLED: z.coerce.boolean().default(false),
  POLYMARKET_WEBSOCKET_URL: z.string().default('wss://clob.polymarket.com/ws'),
  TELEGRAM_ENABLED: z.coerce.boolean().default(false),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  WORKER_ENABLED: z.coerce.boolean().default(true),
  WORKER_SYNC_MARKETS_INTERVAL_SECONDS: z.coerce.number().default(1800),
  WORKER_SYNC_PRICES_INTERVAL_SECONDS: z.coerce.number().default(120),
  WORKER_SYNC_WALLETS_INTERVAL_SECONDS: z.coerce.number().default(600),
  WORKER_CALC_WALLET_SCORES_INTERVAL_SECONDS: z.coerce.number().default(3600),
  WORKER_GENERATE_BUY_SIGNALS_INTERVAL_SECONDS: z.coerce.number().default(600),
  WORKER_MONITOR_SELL_SIGNALS_INTERVAL_SECONDS: z.coerce.number().default(120),
  WORKER_UPDATE_PAPER_TRADES_INTERVAL_SECONDS: z.coerce.number().default(120),
  WORKER_SEND_TELEGRAM_ALERTS_INTERVAL_SECONDS: z.coerce.number().default(60),
});

export const env = envSchema.parse(process.env);
