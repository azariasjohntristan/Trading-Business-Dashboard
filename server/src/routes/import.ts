import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import { parseCsvBuffer, validateCsvColumns, parseAndValidateCsv } from '../utils/csvParser';
import type { ParsedTrade } from '../utils/csvParser';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.endsWith('.csv')) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await prisma.importHistory.findMany({
      orderBy: { importedAt: 'desc' },
      take: 50,
      include: { account: { select: { name: true } } },
    });
    res.json(history);
  } catch (error) {
    console.error('Get import history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const accountId = req.body.accountId as string;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const { columns, records } = parseCsvBuffer(req.file.buffer);

    const columnErrors = validateCsvColumns(columns);
    if (columnErrors.length > 0) {
      return res.status(400).json({ error: columnErrors.join('; ') });
    }

    let parsedTrades: ParsedTrade[];
    try {
      parsedTrades = parseAndValidateCsv(columns, records);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.importHistory.create({
        data: {
          accountId,
          filename: req.file.originalname,
          tradesDetected: records.length,
          newTradesImported: 0,
          duplicatesSkipped: 0,
          status: 'FAILED',
          errorMessages: message,
        },
      });
      return res.status(400).json({ error: message });
    }

    let newCount = 0;
    let duplicateCount = 0;

    for (const trade of parsedTrades) {
      const existing = await prisma.trade.findFirst({
        where: {
          accountId,
          symbol: trade.symbol,
          boughtTimestamp: trade.boughtTimestamp,
          soldTimestamp: trade.soldTimestamp,
          buyPrice: trade.buyPrice,
          sellPrice: trade.sellPrice,
          qty: trade.qty,
        },
      });

      if (existing) {
        duplicateCount++;
        continue;
      }

      await prisma.trade.create({
        data: {
          accountId,
          symbol: trade.symbol,
          direction: trade.direction,
          qty: trade.qty,
          buyPrice: trade.buyPrice,
          sellPrice: trade.sellPrice,
          pnl: trade.pnl,
          boughtTimestamp: trade.boughtTimestamp,
          soldTimestamp: trade.soldTimestamp,
          duration: trade.duration,
          tradeDate: new Date(trade.tradeDate),
          csvPriceFormat: trade._priceFormat,
          csvPriceFormatType: trade._priceFormatType,
          csvTickSize: trade._tickSize,
          buyFillId: trade.buyFillId,
          sellFillId: trade.sellFillId,
        },
      });
      newCount++;
    }

    const status = newCount === parsedTrades.length ? 'SUCCESS' : newCount > 0 ? 'PARTIAL' : 'FAILED';

    await prisma.importHistory.create({
      data: {
        accountId,
        filename: req.file.originalname,
        tradesDetected: parsedTrades.length,
        newTradesImported: newCount,
        duplicatesSkipped: duplicateCount,
        status,
        errorMessages: status === 'FAILED' ? 'All rows were duplicates' : null,
      },
    });

    res.json({
      filename: req.file.originalname,
      tradesDetected: parsedTrades.length,
      newTradesImported: newCount,
      duplicatesSkipped: duplicateCount,
      status,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
