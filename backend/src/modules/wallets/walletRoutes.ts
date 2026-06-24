import { Router } from 'express';
import { WalletRepository } from './walletRepository.js';

export function createWalletRoutes() {
  const router = Router();
  const repo = new WalletRepository();

  router.get('/top', async (_req, res, next) => {
    try { res.json(await repo.getTopWallets()); } catch (e) { next(e); }
  });

  router.get('/:address', async (req, res, next) => {
    try {
      const wallet = await repo.getWallet(req.params.address);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
      res.json(wallet);
    } catch (e) { next(e); }
  });

  return router;
}
