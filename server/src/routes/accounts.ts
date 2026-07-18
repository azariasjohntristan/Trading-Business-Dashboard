import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authMiddleware, async (_req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        trades: { select: { pnl: true } },
      },
      orderBy: { name: 'asc' },
    });

    const stats = accounts.map((a) => {
      const pnls = a.trades.map((t) => Number(t.pnl));
      const totalPnl = pnls.reduce((s, p) => s + p, 0);
      const wins = pnls.filter((p) => p > 0).length;
      const losses = pnls.filter((p) => p < 0).length;
      const winRate = pnls.length > 0 ? (wins / pnls.length) * 100 : 0;
      const grossProfit = pnls.filter((p) => p > 0).reduce((s, p) => s + p, 0);
      const grossLoss = pnls.filter((p) => p < 0).reduce((s, p) => s + Math.abs(p), 0);
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? -1 : 0;

      let runningTotal = 0;
      let peak = 0;
      let maxDrawdown = 0;
      for (const p of pnls) {
        runningTotal += p;
        if (runningTotal > peak) peak = runningTotal;
        const dd = peak - runningTotal;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }

      const initialCapital = a.initialCapital ? Number(a.initialCapital) : null;
      const currentBalance = initialCapital !== null ? initialCapital + totalPnl : null;
      const returnPct = initialCapital !== null && initialCapital !== 0
        ? Math.round((totalPnl / initialCapital) * 10000) / 100
        : null;

      return {
        id: a.id,
        name: a.name,
        description: a.description,
        initialCapital,
        currentBalance: currentBalance !== null ? Math.round(currentBalance * 100) / 100 : null,
        returnPct,
        totalPnl: Math.round(totalPnl * 100) / 100,
        totalTrades: pnls.length,
        winRate: Math.round(winRate * 100) / 100,
        profitFactor: profitFactor === -1 ? -1 : Math.round(profitFactor * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        createdAt: a.createdAt,
      };
    });

    res.json(stats);
  } catch (error) {
    console.error('Account stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, initialCapital } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const account = await prisma.account.create({
      data: {
        name: name.trim(),
        description: description || null,
        initialCapital: initialCapital != null ? initialCapital : null,
      },
    });
    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, initialCapital } = req.body;

    const existing = await prisma.account.findUnique({ where: { id: req.params.id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = await prisma.account.update({
      where: { id: req.params.id as string },
      data: {
        name: name?.trim() ?? existing.name,
        description: description !== undefined ? (description || null) : existing.description,
        initialCapital: initialCapital !== undefined ? (initialCapital != null ? initialCapital : null) : existing.initialCapital,
      },
    });
    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.account.findUnique({ where: { id: req.params.id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await prisma.trade.deleteMany({ where: { accountId: req.params.id as string } });
    await prisma.importHistory.deleteMany({ where: { accountId: req.params.id as string } });
    await prisma.account.delete({ where: { id: req.params.id as string } });

    res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
