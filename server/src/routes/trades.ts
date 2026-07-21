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

router.get('/daily-sessions', authMiddleware, async (req, res) => {
  try {
    const search = (req.query.search as string) || '';
    const direction = req.query.direction as string;
    const accountId = req.query.accountId as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const where: Prisma.TradeWhereInput = {};

    if (search) where.symbol = { contains: search, mode: 'insensitive' };
    if (direction === 'LONG' || direction === 'SHORT') where.direction = direction;
    if (accountId) where.accountId = accountId;
    if (dateFrom) where.tradeDate = { ...(where.tradeDate as object || {}), gte: new Date(dateFrom) };
    if (dateTo) where.tradeDate = { ...(where.tradeDate as object || {}), lte: new Date(dateTo) };

    const allTrades = await prisma.trade.findMany({
      where,
      orderBy: { tradeDate: 'desc' },
      include: { account: { select: { name: true } } },
    });

    const groups = new Map<string, typeof allTrades>();
    for (const t of allTrades) {
      const key = t.tradeDate.toISOString().slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    const sessions = Array.from(groups.entries())
      .map(([date, trades]) => {
        const wins = trades.filter(t => Number(t.pnl) >= 0);
        const losses = trades.filter(t => Number(t.pnl) < 0);
        const totalPnl = trades.reduce((s, t) => s + Number(t.pnl), 0);
        const grossProfit = wins.reduce((s, t) => s + Number(t.pnl), 0);
        const grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));
        const hasScreenshots = trades.filter(t => t.chartLink).length;
        const durations = trades.filter(t => t.duration).map(t => t.duration as string);

        let avgHoldMinutes = 0;
        if (durations.length > 0) {
          const totalMin = durations.reduce((s, d) => {
            const parts = d.match(/(\d+)(h|m)/g);
            if (!parts) return s;
            let min = 0;
            for (const p of parts) {
              if (p.includes('h')) min += parseInt(p) * 60;
              else if (p.includes('m')) min += parseInt(p);
            }
            return s + min;
          }, 0);
          avgHoldMinutes = Math.round(totalMin / durations.length);
        }

        const times = trades
          .map(t => new Date(t.boughtTimestamp))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());

        return {
          date,
          totalPnl: Math.round(totalPnl * 100) / 100,
          totalTrades: trades.length,
          wins: wins.length,
          losses: losses.length,
          winRate: trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0,
          profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? -1 : 0,
          bestTrade: trades.length > 0 ? Math.max(...trades.map(t => Number(t.pnl))) : 0,
          worstTrade: trades.length > 0 ? Math.min(...trades.map(t => Number(t.pnl))) : 0,
          avgWinner: wins.length > 0 ? Math.round((wins.reduce((s, t) => s + Number(t.pnl), 0) / wins.length) * 100) / 100 : 0,
          avgLoser: losses.length > 0 ? Math.round((losses.reduce((s, t) => s + Number(t.pnl), 0) / losses.length) * 100) / 100 : 0,
          avgHoldMinutes,
          firstTradeTime: times.length > 0 ? times[0].toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' }) : null,
          lastTradeTime: times.length > 0 ? times[times.length - 1].toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' }) : null,
          screenshotStatus: trades.length === 0 ? 'none' as const : hasScreenshots === trades.length ? 'complete' as const : hasScreenshots > 0 ? 'partial' as const : 'none' as const,
          trades,
        };
      });

    const total = sessions.length;
    const skip = (page - 1) * limit;
    const paged = sessions.slice(skip, skip + limit);

    res.json({ sessions: paged, total, page, limit });
  } catch (error) {
    console.error('Daily sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const trades = await prisma.trade.findMany({
      where: accountId ? { accountId } : undefined,
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

router.delete('/date/:date', authMiddleware, async (req, res) => {
  try {
    const dateStr = req.params.date as string;
    const start = new Date(dateStr + 'T00:00:00Z');
    const end = new Date(dateStr + 'T23:59:59.999Z');
    const result = await prisma.trade.deleteMany({
      where: { tradeDate: { gte: start, lte: end } },
    });
    res.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete trades by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    await prisma.trade.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
