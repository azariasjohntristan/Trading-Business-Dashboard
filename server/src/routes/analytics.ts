import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function parseDuration(minutes: number): number {
  return minutes;
}

router.get('/performance', authMiddleware, async (req, res) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const accountFilter = accountId ? { accountId } : undefined;

    const accounts = accountId
      ? await prisma.account.findMany({ where: { id: accountId }, select: { initialCapital: true } })
      : await prisma.account.findMany({ select: { initialCapital: true } });
    const totalInitialCapital = accounts.reduce((sum, a) => sum + Number(a.initialCapital ?? 0), 0);

    const allTrades = await prisma.trade.findMany({
      where: accountFilter,
      orderBy: { soldTimestamp: 'asc' },
      select: {
        pnl: true,
        tradeDate: true,
        soldTimestamp: true,
        duration: true,
        boughtTimestamp: true,
      },
    });

    const equityCurve: { date: string; balance: number }[] = [];
    let runningTotal = totalInitialCapital;
    let peak = totalInitialCapital;
    let maxDrawdown = 0;
    let winStreak = 0;
    let loseStreak = 0;
    let currentWinStreak = 0;
    let currentLoseStreak = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    for (const t of allTrades) {
      const pnl = Number(t.pnl);
      runningTotal += pnl;
      const dateStr = t.soldTimestamp.toISOString();
      equityCurve.push({ date: dateStr, balance: Math.round(runningTotal * 100) / 100 });

      if (runningTotal > peak) peak = runningTotal;
      const drawdown = peak - runningTotal;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      if (pnl > 0) {
        grossProfit += pnl;
        currentWinStreak++;
        currentLoseStreak = 0;
        if (currentWinStreak > winStreak) winStreak = currentWinStreak;
      } else {
        grossLoss += Math.abs(pnl);
        currentLoseStreak++;
        currentWinStreak = 0;
        if (currentLoseStreak > loseStreak) loseStreak = currentLoseStreak;
      }
    }

    const totalPnL = allTrades.reduce((sum, t) => sum + Number(t.pnl), 0);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? -1 : 0;
    const expectancy = allTrades.length > 0 ? totalPnL / allTrades.length : 0;

    const dailyMap = new Map<string, { pnl: number; trades: number }>();
    const weeklyMap = new Map<string, { pnl: number; trades: number }>();
    const monthlyMap = new Map<string, { pnl: number; trades: number }>();

    for (const t of allTrades) {
      const pnl = Number(t.pnl);
      const dateStr = t.tradeDate.toISOString().split('T')[0];

      const d = dailyMap.get(dateStr) ?? { pnl: 0, trades: 0 };
      d.pnl += pnl;
      d.trades++;
      dailyMap.set(dateStr, d);

      const date = t.tradeDate;
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStr = weekStart.toISOString().split('T')[0];
      const w = weeklyMap.get(weekStr) ?? { pnl: 0, trades: 0 };
      w.pnl += pnl;
      w.trades++;
      weeklyMap.set(weekStr, w);

      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const m = monthlyMap.get(monthStr) ?? { pnl: 0, trades: 0 };
      m.pnl += pnl;
      m.trades++;
      monthlyMap.set(monthStr, m);
    }

    res.json({
      equityCurve,
      dailyPnl: Array.from(dailyMap.entries()).map(([date, d]) => ({
        date, pnl: Math.round(d.pnl * 100) / 100, trades: d.trades,
      })),
      weeklyPnl: Array.from(weeklyMap.entries()).map(([week, w]) => ({
        week, pnl: Math.round(w.pnl * 100) / 100, trades: w.trades,
      })),
      monthlyPnl: Array.from(monthlyMap.entries()).map(([month, m]) => ({
        month, pnl: Math.round(m.pnl * 100) / 100, trades: m.trades,
      })),
      profitFactor: profitFactor === -1 ? -1 : Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      winStreak,
      loseStreak,
      totalTrades: allTrades.length,
      totalPnL: Math.round(totalPnL * 100) / 100,
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/behavior', authMiddleware, async (req, res) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const accountFilter = accountId ? { accountId } : undefined;

    const allTrades = await prisma.trade.findMany({
      where: accountFilter,
      select: {
        pnl: true,
        boughtTimestamp: true,
        tradeDate: true,
        duration: true,
        direction: true,
        qty: true,
        symbol: true,
      },
    });

    const hourlyMap = new Map<number, { pnl: number; trades: number; wins: number }>();
    const weekdayMap = new Map<number, { pnl: number; trades: number; wins: number }>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let totalDurationMinutes = 0;
    let durationCount = 0;
    let winDurationMinutes = 0;
    let winDurationCount = 0;
    let loseDurationMinutes = 0;
    let loseDurationCount = 0;
    let longPnl = 0;
    let longTrades = 0;
    let longWins = 0;
    let shortPnl = 0;
    let shortTrades = 0;
    let shortWins = 0;
    let totalQty = 0;

    for (const t of allTrades) {
      const pnl = Number(t.pnl);
      const hour = t.boughtTimestamp.getHours();
      const dayOfWeek = t.tradeDate.getDay();
      const qty = Number(t.qty);

      const h = hourlyMap.get(hour) ?? { pnl: 0, trades: 0, wins: 0 };
      h.pnl += pnl;
      h.trades++;
      if (pnl > 0) h.wins++;
      hourlyMap.set(hour, h);

      const wd = weekdayMap.get(dayOfWeek) ?? { pnl: 0, trades: 0, wins: 0 };
      wd.pnl += pnl;
      wd.trades++;
      if (pnl > 0) wd.wins++;
      weekdayMap.set(dayOfWeek, wd);

      if (t.duration) {
        const parts = t.duration.match(/(\d+)h\s*(\d+)m/);
        if (parts) {
          const minutes = parseInt(parts[1]) * 60 + parseInt(parts[2]);
          totalDurationMinutes += minutes;
          durationCount++;
          if (pnl > 0) {
            winDurationMinutes += minutes;
            winDurationCount++;
          } else {
            loseDurationMinutes += minutes;
            loseDurationCount++;
          }
        }
      }

      if (t.direction === 'LONG') {
        longPnl += pnl;
        longTrades++;
        if (pnl > 0) longWins++;
      } else {
        shortPnl += pnl;
        shortTrades++;
        if (pnl > 0) shortWins++;
      }

      totalQty += qty;
    }

    const avgHolding = durationCount > 0 ? Math.round(totalDurationMinutes / durationCount) : 0;
    const winDuration = winDurationCount > 0 ? Math.round(winDurationMinutes / winDurationCount) : 0;
    const loseDuration = loseDurationCount > 0 ? Math.round(loseDurationMinutes / loseDurationCount) : 0;

    res.json({
      hourly: Array.from(hourlyMap.entries())
        .map(([hour, h]) => ({
          hour,
          pnl: Math.round(h.pnl * 100) / 100,
          trades: h.trades,
          winRate: h.trades > 0 ? Math.round((h.wins / h.trades) * 10000) / 100 : 0,
        }))
        .sort((a, b) => a.hour - b.hour),
      weekday: Array.from(weekdayMap.entries())
        .map(([day, w]) => ({
          day: dayNames[day],
          dayIndex: day,
          pnl: Math.round(w.pnl * 100) / 100,
          trades: w.trades,
          winRate: w.trades > 0 ? Math.round((w.wins / w.trades) * 10000) / 100 : 0,
        }))
        .sort((a, b) => a.dayIndex - b.dayIndex),
      duration: {
        avgHolding,
        winDuration,
        loseDuration,
      },
      direction: {
        long: {
          pnl: Math.round(longPnl * 100) / 100,
          trades: longTrades,
          winRate: longTrades > 0 ? Math.round((longWins / longTrades) * 10000) / 100 : 0,
          wins: longWins,
        },
        short: {
          pnl: Math.round(shortPnl * 100) / 100,
          trades: shortTrades,
          winRate: shortTrades > 0 ? Math.round((shortWins / shortTrades) * 10000) / 100 : 0,
          wins: shortWins,
        },
      },
      execution: {
        avgQty: allTrades.length > 0 ? Math.round((totalQty / allTrades.length) * 100) / 100 : 0,
        totalTrades: allTrades.length,
      },
    });
  } catch (error) {
    console.error('Behavior analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
