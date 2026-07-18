import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/kpi', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const nyOptions = { timeZone: 'America/New_York' };
    const accountId = req.query.accountId as string | undefined;

    const accountFilter = accountId ? { accountId } : undefined;

    const todayStr = now.toLocaleDateString('en-CA', nyOptions);
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const dayOfWeek = now.getDay();
    const monday = new Date(todayStart);
    monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7));

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const makeWhere = (dateFilter: object) => accountFilter ? { ...dateFilter, ...accountFilter } : dateFilter;

    const [todayAgg, weekAgg, monthAgg, allTradeRecords, weekTrades] = await Promise.all([
      prisma.trade.aggregate({
        where: makeWhere({ tradeDate: { gte: todayStart, lt: todayEnd } }),
        _sum: { pnl: true },
        _count: true,
      }),
      prisma.trade.aggregate({
        where: makeWhere({ tradeDate: { gte: monday, lt: todayEnd } }),
        _sum: { pnl: true },
        _count: true,
      }),
      prisma.trade.aggregate({
        where: makeWhere({ tradeDate: { gte: monthStart, lt: todayEnd } }),
        _sum: { pnl: true },
        _count: true,
      }),
      prisma.trade.findMany({
        where: accountFilter,
        select: { pnl: true, soldTimestamp: true },
        orderBy: { soldTimestamp: 'asc' },
      }),
      prisma.trade.findMany({
        where: makeWhere({ tradeDate: { gte: monday, lt: todayEnd }, pnl: { lt: 0 } }),
        select: { pnl: true },
      }),
    ]);

    const weekGrossLoss = weekTrades.reduce((sum, t) => sum + Math.abs(Number(t.pnl)), 0);

    const allTrades = allTradeRecords;
    const totalTrades = allTrades.length;
    let winRate = 0;
    let profitFactor = 0;
    let avgWin = 0;
    let avgLoss = 0;
    let bestTrade = 0;
    let worstTrade = 0;
    let maxDrawdown = 0;

    if (totalTrades > 0) {
      const pnlValues = allTrades.map(t => Number(t.pnl));
      const wins = pnlValues.filter(v => v > 0);
      const losses = pnlValues.filter(v => v < 0);

      winRate = (wins.length / totalTrades) * 100;

      const grossProfit = wins.reduce((sum, v) => sum + v, 0);
      const grossLoss = losses.reduce((sum, v) => sum + Math.abs(v), 0);

      profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

      avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
      avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
      bestTrade = wins.length > 0 ? Math.max(...wins) : 0;
      worstTrade = losses.length > 0 ? Math.min(...losses) : 0;

      let cumPnl = 0;
      let peak = 0;
      for (const t of allTrades) {
        cumPnl += Number(t.pnl);
        if (cumPnl > peak) peak = cumPnl;
        const dd = peak - cumPnl;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }
    }

    res.json({
      todayPnl: Number(todayAgg._sum.pnl ?? 0),
      todayTrades: todayAgg._count,
      weekPnl: Number(weekAgg._sum.pnl ?? 0),
      weekTrades: weekAgg._count,
      weekGrossLoss,
      monthPnl: Number(monthAgg._sum.pnl ?? 0),
      monthTrades: monthAgg._count,
      totalPnl: Math.round(allTrades.reduce((sum, t) => sum + Number(t.pnl), 0) * 100) / 100,
      totalTrades,
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: profitFactor === Infinity ? -1 : Math.round(profitFactor * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
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
    const accountId = req.query.accountId as string | undefined;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay();
    const lastDayOfWeek = lastDay.getDay();

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek) + 1);

    const daily = await prisma.trade.groupBy({
      by: ['tradeDate'],
      where: {
        tradeDate: { gte: startDate, lt: endDate },
        ...(accountId ? { accountId } : {}),
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
    const accountId = req.query.accountId as string | undefined;

    const trades = await prisma.trade.findMany({
      where: {
        tradeDate: { gte: date, lt: nextDay },
        ...(accountId ? { accountId } : {}),
      },
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
