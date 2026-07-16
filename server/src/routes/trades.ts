import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import type { Prisma } from '@prisma/client';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const direction = req.query.direction as string;
    const accountId = req.query.accountId as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const sortBy = (req.query.sortBy as string) || 'soldTimestamp';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: Prisma.TradeWhereInput = {};

    if (search) {
      where.symbol = { contains: search, mode: 'insensitive' };
    }

    if (direction === 'LONG' || direction === 'SHORT') {
      where.direction = direction;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (dateFrom) {
      where.tradeDate = { ...(where.tradeDate as object || {}), gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.tradeDate = { ...(where.tradeDate as object || {}), lte: new Date(dateTo) };
    }

    const orderBy: Prisma.TradeOrderByWithRelationInput = {};
    const validSortFields = ['soldTimestamp', 'boughtTimestamp', 'pnl', 'symbol', 'qty', 'buyPrice', 'sellPrice', 'tradeDate'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'soldTimestamp';
    orderBy[field as keyof Prisma.TradeOrderByWithRelationInput] = sortOrder;

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { account: { select: { name: true } } },
      }),
      prisma.trade.count({ where }),
    ]);

    res.json({ trades, total, page, limit });
  } catch (error) {
    console.error('List trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const trade = await prisma.trade.findUnique({
      where: { id: req.params.id as string },
      include: { account: { select: { name: true } } },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json(trade);
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { chartLink } = req.body;

    const trade = await prisma.trade.findUnique({
      where: { id: req.params.id as string },
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const updated = await prisma.trade.update({
      where: { id: req.params.id as string },
      data: { chartLink: chartLink ?? null },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
