import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { createMarketRoutes } from './modules/markets/marketRoutes.js';
import { createWalletRoutes } from './modules/wallets/walletRoutes.js';
import { createSignalRoutes } from './modules/signals/signalRoutes.js';
import { createPaperTradingRoutes } from './modules/paperTrading/paperTradingRoutes.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'polymarket-signal-lab-api', mode: env.DATA_MODE, time: new Date().toISOString() });
});

app.use('/api/markets', createMarketRoutes());
app.use('/api/wallets', createWalletRoutes());
app.use('/api/signals', createSignalRoutes());
app.use('/api/paper-trades', createPaperTradingRoutes());

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', detail: err?.message ?? String(err) });
});

app.listen(env.PORT, () => {
  console.log(`Polymarket Signal Lab API listening on port ${env.PORT}`);
});
