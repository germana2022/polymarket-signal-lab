import { Router } from 'express';
import { MarketRepository } from './marketRepository.js';

export function createMarketRoutes() {
  const router = Router();
  const repo = new MarketRepository();

  router.get('/hot', async (_req, res, next) => {
    try { res.json(await repo.getHotMarkets()); } catch (e) { next(e); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const market = await repo.getById(req.params.id);
      if (!market) return res.status(404).json({ error: 'Market not found' });
      res.json(market);
    } catch (e) { next(e); }
  });

  return router;
}
