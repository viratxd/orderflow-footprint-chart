import type { Trade, FootprintLevel, FootprintCandle, AggregateOptions } from './FootprintTypes';

/** Round price to nearest tick boundary (banker's-safe for floats). */
export function priceToTickIndex(price: number, tickSize: number): number {
  if (tickSize <= 0) throw new Error('tickSize must be > 0');
  return Math.round(price / tickSize);
}

export function tickIndexToPrice(tickIndex: number, tickSize: number): number {
  return tickIndex * tickSize;
}

/** Floor timestamp into candle start (UTC-aligned to timeframe). */
export function candleStart(timestamp: number, timeframeMs: number): number {
  return Math.floor(timestamp / timeframeMs) * timeframeMs;
}

export function emptyLevel(price: number, tickIndex: number): FootprintLevel {
  return {
    price,
    tickIndex,
    buyVolume: 0,
    sellVolume: 0,
    totalVolume: 0,
    delta: 0,
  };
}

export function recomputeLevel(level: FootprintLevel): void {
  level.totalVolume = level.buyVolume + level.sellVolume;
  level.delta = level.buyVolume - level.sellVolume;
}

export function recomputeCandleAggregates(candle: FootprintCandle): void {
  let buy = 0;
  let sell = 0;
  let high = -Infinity;
  let low = Infinity;
  for (const l of candle.levels) {
    buy += l.buyVolume;
    sell += l.sellVolume;
    if (l.totalVolume > 0) {
      if (l.price > high) high = l.price;
      if (l.price < low) low = l.price;
    }
  }
  candle.buyVolume = buy;
  candle.sellVolume = sell;
  candle.totalVolume = buy + sell;
  candle.delta = buy - sell;
  if (high !== -Infinity) {
    candle.high = Math.max(candle.high, high);
    candle.low = Math.min(candle.low, low);
  }
}

/**
 * Aggregate raw trades into footprint candles.
 * Does NOT invent data for missing intervals — gaps stay gaps.
 */
export function aggregateTradesToFootprint(
  trades: Trade[],
  options: AggregateOptions
): FootprintCandle[] {
  const { tickSize, timeframeMs } = options;
  if (!trades.length) return [];

  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const candleMap = new Map<number, FootprintCandle>();

  for (const t of sorted) {
    if (t.quantity <= 0 || !Number.isFinite(t.price)) continue;
    const start = candleStart(t.timestamp, timeframeMs);
    let candle = candleMap.get(start);
    if (!candle) {
      candle = {
        id: `c-${start}`,
        startTime: start,
        endTime: start + timeframeMs,
        open: t.price,
        high: t.price,
        low: t.price,
        close: t.price,
        levels: [],
        totalVolume: 0,
        buyVolume: 0,
        sellVolume: 0,
        delta: 0,
        completed: false,
      };
      candleMap.set(start, candle);
    }

    candle.close = t.price;
    candle.high = Math.max(candle.high, t.price);
    candle.low = Math.min(candle.low, t.price);

    const tickIndex = priceToTickIndex(t.price, tickSize);
    const price = tickIndexToPrice(tickIndex, tickSize);
    let level = candle.levels.find((l) => l.tickIndex === tickIndex);
    if (!level) {
      level = emptyLevel(price, tickIndex);
      candle.levels.push(level);
    }
    if (t.side === 'buy') level.buyVolume += t.quantity;
    else level.sellVolume += t.quantity;
    recomputeLevel(level);
  }

  const candles = Array.from(candleMap.values()).sort((a, b) => a.startTime - b.startTime);
  for (const c of candles) {
    c.levels.sort((a, b) => b.tickIndex - a.tickIndex); // high → low (DOM style)
    recomputeCandleAggregates(c);
  }
  return candles;
}

/** Merge a completed authoritative snapshot over a forming candle (replace, not blend). */
export function replaceCandle(
  existing: FootprintCandle[],
  snapshot: FootprintCandle
): FootprintCandle[] {
  const idx = existing.findIndex((c) => c.startTime === snapshot.startTime);
  const next = [...existing];
  if (idx >= 0) next[idx] = { ...snapshot, completed: true };
  else {
    next.push({ ...snapshot, completed: true });
    next.sort((a, b) => a.startTime - b.startTime);
  }
  return next;
}

export function formatVolume(v: number, decimals = 0): string {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toFixed(decimals);
}

export function formatPrice(p: number, tickSize: number): string {
  if (!Number.isFinite(p)) return '—';
  const decimals = Math.max(0, Math.ceil(-Math.log10(tickSize)));
  return p.toFixed(decimals);
}

export function formatDelta(d: number): string {
  if (!Number.isFinite(d)) return '—';
  const sign = d > 0 ? '+' : '';
  return sign + formatVolume(d);
}
