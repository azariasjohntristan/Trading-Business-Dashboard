import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/recent', authMiddleware, async (_req, res) => {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { soldTimestamp: 'desc' },
      take: 10,
      include: { account: { select: { name: true } } },
    });
    res.json(trades);
  } catch (error) {
    console.error('Recent trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
