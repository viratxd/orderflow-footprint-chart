import type { Trade, FootprintCandle, FootprintLevel } from '../modules/footprint';
import { aggregateTradesToFootprint, applyImbalancePipeline } from '../modules/footprint';
import { DEFAULT_IMBALANCE } from '../modules/footprint';

const TICK = 0.5;
const TF = 60_000;
const BASE = Date.UTC(2026, 7, 9, 7, 0, 0); // 09 Aug 2026 07:00 UTC

function level(
  price: number,
  buy: number,
  sell: number
): FootprintLevel {
  const tickIndex = Math.round(price / TICK);
  return {
    price: tickIndex * TICK,
    tickIndex,
    buyVolume: buy,
    sellVolume: sell,
    totalVolume: buy + sell,
    delta: buy - sell,
  };
}

/** Deterministic demo candles covering all required scenarios. */
export function buildDemoCandles(): FootprintCandle[] {
  const candles: FootprintCandle[] = [];

  // Candle 0 — normal balanced footprint
  candles.push({
    id: 'c-0',
    startTime: BASE,
    endTime: BASE + TF,
    open: 100,
    high: 102,
    low: 98.5,
    close: 101,
    levels: [
      level(102, 40, 55),
      level(101.5, 60, 50),
      level(101, 80, 70),
      level(100.5, 90, 85),
      level(100, 120, 110),
      level(99.5, 70, 75),
      level(99, 50, 60),
      level(98.5, 30, 40),
    ],
    totalVolume: 0,
    buyVolume: 0,
    sellVolume: 0,
    delta: 0,
    completed: true,
  });

  // Candle 1 — strong buy imbalance (same-price & diagonal)
  candles.push({
    id: 'c-1',
    startTime: BASE + TF,
    endTime: BASE + 2 * TF,
    open: 101,
    high: 104,
    low: 100,
    close: 103.5,
    levels: [
      level(104, 20, 5),
      level(103.5, 300, 40), // strong buy
      level(103, 250, 50),
      level(102.5, 180, 30),
      level(102, 90, 80),
      level(101.5, 60, 70),
      level(101, 40, 55),
      level(100.5, 25, 40),
      level(100, 15, 30),
    ],
    totalVolume: 0,
    buyVolume: 0,
    sellVolume: 0,
    delta: 0,
    completed: true,
  });

  // Candle 2 — strong sell imbalance
  candles.push({
    id: 'c-2',
    startTime: BASE + 2 * TF,
    endTime: BASE + 3 * TF,
    open: 103.5,
    high: 104,
    low: 99,
    close: 99.5,
    levels: [
      level(104, 10, 20),
      level(103.5, 30, 40),
      level(103, 40, 90),
      level(102.5, 25, 200),
      level(102, 20, 280), // strong sell
      level(101.5, 15, 220),
      level(101, 40, 60),
      level(100.5, 50, 55),
      level(100, 35, 40),
      level(99.5, 20, 25),
      level(99, 10, 15),
    ],
    totalVolume: 0,
    buyVolume: 0,
    sellVolume: 0,
    delta: 0,
    completed: true,
  });

  // Candle 3 — 3-level stacked buy imbalance (consecutive ticks)
  candles.push({
    id: 'c-3',
    startTime: BASE + 3 * TF,
    endTime: BASE + 4 * TF,
    open: 99.5,
    high: 102,
    low: 98,
    close: 101.5,
    levels: [
      level(102, 30, 40),
      level(101.5, 40, 35),
      level(101, 320, 50), // stack buy 1
      level(100.5, 310, 45), // stack buy 2
      level(100, 300, 40), // stack buy 3
      level(99.5, 60, 70),
      level(99, 40, 50),
      level(98.5, 20, 30),
      level(98, 10, 15),
    ],
    totalVolume: 0,
    buyVolume: 0,
    sellVolume: 0,
    delta: 0,
    completed: true,
  });

  // Candle 4 — sparse / missing price levels (gaps)
  candles.push({
    id: 'c-4',
    startTime: BASE + 4 * TF,
    endTime: BASE + 5 * TF,
    open: 101.5,
    high: 105,
    low: 100,
    close: 104,
    levels: [
      level(105, 15, 10),
      // gap 104.5
      level(104, 80, 20),
      // gap 103.5, 103
      level(102.5, 40, 90),
      level(102, 30, 35),
      // gap 101.5
      level(101, 50, 45),
      level(100.5, 20, 25),
      level(100, 10, 12),
    ],
    totalVolume: 0,
    buyVolume: 0,
    sellVolume: 0,
    delta: 0,
    completed: true,
  });

  // Candle 5 — forming / live (partial volume)
  candles.push({
    id: 'c-5',
    startTime: BASE + 5 * TF,
    endTime: BASE + 6 * TF,
    open: 104,
    high: 104.5,
    low: 103,
    close: 104,
    levels: [
      level(104.5, 12, 8),
      level(104, 45, 30),
      level(103.5, 20, 25),
      level(103, 5, 10),
    ],
    totalVolume: 0,
    buyVolume: 0,
    sellVolume: 0,
    delta: 0,
    completed: false,
  });

  for (const c of candles) {
    c.buyVolume = c.levels.reduce((s, l) => s + l.buyVolume, 0);
    c.sellVolume = c.levels.reduce((s, l) => s + l.sellVolume, 0);
    c.totalVolume = c.buyVolume + c.sellVolume;
    c.delta = c.buyVolume - c.sellVolume;
  }

  applyImbalancePipeline(candles, {
    ...DEFAULT_IMBALANCE,
    mode: 'diagonal',
    ratio: 3,
    stackLevels: 3,
    showHighlights: true,
  });

  return candles;
}

/** Generate synthetic trades for engine tests / live demo. */
export function generateTrades(count = 500): Trade[] {
  const trades: Trade[] = [];
  let price = 100;
  let t = BASE;
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.48 ? 'buy' : 'sell';
    const qty = Math.round((Math.random() * 40 + 5) * 10) / 10;
    price = Math.round((price + (Math.random() - 0.48) * 0.8) / TICK) * TICK;
    t += Math.floor(Math.random() * 800) + 50;
    trades.push({ timestamp: t, price, quantity: qty, side });
  }
  return trades;
}

export function tradesToCandles(trades: Trade[]): FootprintCandle[] {
  const candles = aggregateTradesToFootprint(trades, { tickSize: TICK, timeframeMs: TF });
  applyImbalancePipeline(candles, { ...DEFAULT_IMBALANCE, mode: 'diagonal', ratio: 3 });
  return candles;
}
