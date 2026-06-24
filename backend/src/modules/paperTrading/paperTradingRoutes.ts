import { Router } from 'express';
import { PaperTradingRepository } from './paperTradingRepository.js';
import { SignalRepository } from '../signals/signalRepository.js';
import { MarketRepository } from '../markets/marketRepository.js';

export function createPaperTradingRoutes() {
  const router = Router();
  const repo = new PaperTradingRepository();
  const signals = new SignalRepository();
  const markets = new MarketRepository();

  router.get('/performance', async (_req, res, next) => {
    try { res.json(await repo.performance()); } catch (e) { next(e); }
  });

  router.post('/open/:signalId', async (req, res, next) => {
    try {
      const signal: any = await signals.getById(Number(req.params.signalId));
      if (!signal) return res.status(404).json({ error: 'Signal not found' });
      const id = await repo.open(Number(signal.id), Number(signal.current_price));
      await signals.updateStatus(Number(signal.id), 'HOLD', signal.action, 'Paper trade opened.');
      res.json({ paperTradeId: id });
    } catch (e) { next(e); }
  });

  router.post('/close/:signalId', async (req, res, next) => {
    try {
      const signal: any = await signals.getById(Number(req.params.signalId));
      if (!signal) return res.status(404).json({ error: 'Signal not found' });
      const snapshot: any = await markets.getLatestSnapshot(signal.market_id, signal.side);
      const exitPrice = Number(req.body?.exitPrice ?? snapshot?.price ?? signal.current_price);
      const result = await repo.close(Number(signal.id), exitPrice);
      await signals.updateStatus(Number(signal.id), 'PAPER_CLOSED');
      res.json({ result });
    } catch (e) { next(e); }
  });

  return router;
}
