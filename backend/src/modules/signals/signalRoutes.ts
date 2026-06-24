import { Router } from 'express';
import { IngestionJob } from '../../jobs/ingestionJob.js';
import { BuyDecisionEngine } from './buyDecisionEngine.js';
import { SellDecisionEngine } from './sellDecisionEngine.js';
import { SignalRepository } from './signalRepository.js';
import { TelegramService } from '../alerts/telegramService.js';
import { formatSignalAlert } from '../alerts/alertFormatter.js';

export function createSignalRoutes() {
  const router = Router();
  const repo = new SignalRepository();

  router.get('/latest', async (_req, res, next) => {
    try { res.json(await repo.latest()); } catch (e) { next(e); }
  });

  router.get('/open', async (_req, res, next) => {
    try { res.json(await repo.openSignals()); } catch (e) { next(e); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const signal = await repo.getById(Number(req.params.id));
      if (!signal) return res.status(404).json({ error: 'Signal not found' });
      res.json(signal);
    } catch (e) { next(e); }
  });

  router.post('/run', async (_req, res, next) => {
    try {
      const ingestion = await new IngestionJob().run();
      const createdIds = await new BuyDecisionEngine().generateSignals();
      const sellAlerts = await new SellDecisionEngine().monitorOpenSignals();
      const latest = await repo.latest(createdIds.length || 10);
      const telegram = new TelegramService();
      for (const signal of latest.filter((s: any) => createdIds.includes(Number(s.id)))) {
        await telegram.send(formatSignalAlert(signal));
      }
      res.json({ ingestion, createdSignalIds: createdIds, sellAlertIds: sellAlerts });
    } catch (e) { next(e); }
  });

  return router;
}
