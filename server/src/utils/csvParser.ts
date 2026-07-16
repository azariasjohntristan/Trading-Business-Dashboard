import { parse } from 'csv-parse/sync';
import { parsePnl } from './pnlParser';

const REQUIRED_COLUMNS = [
  'symbol', 'qty', 'buyPrice', 'sellPrice', 'pnl',
  'boughtTimestamp', 'soldTimestamp', 'duration',
  '_priceFormat', '_priceFormatType', '_tickSize',
  'buyFillId', 'sellFillId',
];

export interface CsvRow {
  symbol: string;
  _priceFormat: string;
  _priceFormatType: string;
  _tickSize: string;
  buyFillId: string;
  sellFillId: string;
  qty: string;
  buyPrice: string;
  sellPrice: string;
  pnl: string;
  boughtTimestamp: string;
  soldTimestamp: string;
  duration: string;
}

export interface ParsedTrade {
  symbol: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  pnl: number;
  boughtTimestamp: Date;
  soldTimestamp: Date;
  duration: string;
  direction: 'LONG' | 'SHORT';
  tradeDate: string;
  _priceFormat: string;
  _priceFormatType: string;
  _tickSize: number;
  buyFillId: string;
  sellFillId: string;
}

export interface CsvParseResult {
  valid: boolean;
  errors: string[];
  rows: CsvRow[];
}

export function validateCsvColumns(columns: string[]): string[] {
  const errors: string[] = [];
  for (const col of REQUIRED_COLUMNS) {
    if (!columns.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  }
  return errors;
}

export function parseAndValidateCsv(
  rawColumns: string[],
  rawRecords: Record<string, string>[],
): ParsedTrade[] {
  const trades: ParsedTrade[] = [];

  for (let i = 0; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    const line = i + 2;

    try {
      const qty = parseFloat(row.qty);
      const buyPrice = parseFloat(row.buyPrice);
      const sellPrice = parseFloat(row.sellPrice);
      const pnl = parsePnl(row.pnl);
      const _tickSize = parseFloat(row._tickSize);

      if (isNaN(qty)) throw new Error(`Invalid qty: "${row.qty}"`);
      if (isNaN(buyPrice)) throw new Error(`Invalid buyPrice: "${row.buyPrice}"`);
      if (isNaN(sellPrice)) throw new Error(`Invalid sellPrice: "${row.sellPrice}"`);
      if (isNaN(pnl)) throw new Error(`Invalid pnl: "${row.pnl}"`);
      if (isNaN(_tickSize)) throw new Error(`Invalid _tickSize: "${row._tickSize}"`);

      const boughtTimestamp = new Date(row.boughtTimestamp);
      const soldTimestamp = new Date(row.soldTimestamp);
      if (isNaN(boughtTimestamp.getTime())) throw new Error(`Invalid boughtTimestamp: "${row.boughtTimestamp}"`);
      if (isNaN(soldTimestamp.getTime())) throw new Error(`Invalid soldTimestamp: "${row.soldTimestamp}"`);

      const direction = sellPrice > buyPrice ? 'LONG' : 'SHORT';

      const tradeDate = boughtTimestamp.toLocaleDateString('en-CA', {
        timeZone: 'America/New_York',
      });

      trades.push({
        symbol: row.symbol,
        qty,
        buyPrice,
        sellPrice,
        pnl,
        boughtTimestamp,
        soldTimestamp,
        duration: row.duration,
        direction,
        tradeDate,
        _priceFormat: row._priceFormat,
        _priceFormatType: row._priceFormatType,
        _tickSize,
        buyFillId: row.buyFillId,
        sellFillId: row.sellFillId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Row ${line}: ${message}`);
    }
  }

  return trades;
}

export function parseCsvBuffer(buffer: Buffer): { columns: string[]; records: Record<string, string>[] } {
  const raw = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const records = raw as Record<string, string>[];
  const columns = records.length > 0 ? Object.keys(records[0]) : [];

  return { columns, records };
}
