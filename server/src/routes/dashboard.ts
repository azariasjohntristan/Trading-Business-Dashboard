import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/kpi', authMiddleware, async (_req, res) => {
  try {
    const now = new Date();
    const nyOptions = { timeZone: 'America/New_York' };

    const todayStr = now.toLocaleDateString('en-CA', nyOptions);
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const dayOfWeek = now.getDay();
    const monday = new Date(todayStart);
    monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const [todayAgg, weekAgg, monthAgg, totalAgg, winRateAgg] = await Promise.all([
      prisma.trade.aggregate({
        where: { tradeDate: { gte: todayStart, lt: todayEnd } },
        _sum: { pnl: true },
        _count: true,
      }),
      prisma.trade.aggregate({
        where: { tradeDate: { gte: monday, lt: todayEnd } },
        _sum: { pnl: true },
        _count: true,
      }),
      prisma.trade.aggregate({
        where: { tradeDate: { gte: monthStart, lt: todayEnd } },
        _sum: { pnl: true },
        _count: true,
      }),
      prisma.trade.aggregate({
        _sum: { pnl: true },
        _count: true,
      }),
      prisma.trade.findMany({
        select: { pnl: true },
      }),
    ]);

    const totalTrades = totalAgg._count;
    let winRate = 0;
    let profitFactor = 0;

    if (totalTrades > 0) {
      const wins = winRateAgg.filter(t => Number(t.pnl) > 0).length;
      winRate = (wins / totalTrades) * 100;

      const grossProfit = winRateAgg
        .filter(t => Number(t.pnl) > 0)
        .reduce((sum, t) => sum + Number(t.pnl), 0);
      const grossLoss = winRateAgg
        .filter(t => Number(t.pnl) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.pnl)), 0);

      profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    }

    res.json({
      todayPnl: Number(todayAgg._sum.pnl ?? 0),
      todayTrades: todayAgg._count,
      weekPnl: Number(weekAgg._sum.pnl ?? 0),
      weekTrades: weekAgg._count,
      monthPnl: Number(monthAgg._sum.pnl ?? 0),
      monthTrades: monthAgg._count,
      totalPnl: Number(totalAgg._sum.pnl ?? 0),
      totalTrades,
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: profitFactor === Infinity ? -1 : Math.round(profitFactor * 100) / 100,
    });
  } catch (error) {
    console.error('KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const daily = await prisma.trade.groupBy({
      by: ['tradeDate'],
      where: {
        tradeDate: {
          gte: new Date(`${monthStr}-01`),
          lt: new Date(month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`),
        },
      },
      _sum: { pnl: true },
      _count: true,
    });

    res.json(
      daily.map((d) => ({
        date: d.tradeDate.toISOString().split('T')[0],
        pnl: Number(d._sum.pnl ?? 0),
        trades: d._count,
      })),
    );
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/calendar/:date', authMiddleware, async (req, res) => {
  try {
    const date = new Date(req.params.date as string);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const trades = await prisma.trade.findMany({
      where: { tradeDate: { gte: date, lt: nextDay } },
      orderBy: { boughtTimestamp: 'desc' },
    });

    const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl), 0);
    const wins = trades.filter(t => Number(t.pnl) > 0).length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

    res.json({
      date: req.params.date,
      totalPnl: Math.round(totalPnl * 100) / 100,
      totalTrades: trades.length,
      winRate: Math.round(winRate * 100) / 100,
      trades,
    });
  } catch (error) {
    console.error('Day detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
