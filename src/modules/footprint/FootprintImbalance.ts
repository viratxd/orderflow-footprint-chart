import type {
  FootprintCandle,
  FootprintLevel,
  ImbalanceSettings,
  ImbalanceStack,
  Side,
} from './FootprintTypes';

/**
 * Same-price imbalance:
 *   buy / sell >= ratio  → buy imbalance
 *   sell / buy >= ratio  → sell imbalance
 * Avoid division by zero; respect minimumVolume.
 */
export function detectSamePriceImbalance(
  level: FootprintLevel,
  settings: ImbalanceSettings
): { buy: boolean; sell: boolean } {
  const { ratio, minimumVolume } = settings;
  const { buyVolume: b, sellVolume: s } = level;
  let buy = false;
  let sell = false;
  if (b >= minimumVolume && s >= minimumVolume) {
    if (s > 0 && b / s >= ratio) buy = true;
    if (b > 0 && s / b >= ratio) sell = true;
  } else if (b >= minimumVolume && s === 0) {
    // pure buy with enough volume counts as buy imbalance when ratio is finite
    buy = true;
  } else if (s >= minimumVolume && b === 0) {
    sell = true;
  }
  return { buy, sell };
}

/**
 * Diagonal imbalance (order-flow convention):
 *   Buy imbalance at P  : buy(P)  / sell(P - tick)  >= ratio
 *   Sell imbalance at P : sell(P) / buy(P + tick)   >= ratio
 *
 * Neighbor relationship is explicit by tickIndex, never by visual adjacency.
 */
export function detectDiagonalImbalance(
  levels: FootprintLevel[],
  index: number,
  settings: ImbalanceSettings
): { buy: boolean; sell: boolean } {
  const { ratio, minimumVolume } = settings;
  const level = levels[index];
  const byTick = new Map(levels.map((l) => [l.tickIndex, l]));

  let buy = false;
  let sell = false;

  // lower neighbor for buy comparison
  const lower = byTick.get(level.tickIndex - 1);
  if (level.buyVolume >= minimumVolume) {
    const denom = lower ? lower.sellVolume : 0;
    if (denom === 0) {
      if (level.buyVolume >= minimumVolume) buy = true;
    } else if (level.buyVolume / denom >= ratio) {
      buy = true;
    }
  }

  // higher neighbor for sell comparison
  const higher = byTick.get(level.tickIndex + 1);
  if (level.sellVolume >= minimumVolume) {
    const denom = higher ? higher.buyVolume : 0;
    if (denom === 0) {
      if (level.sellVolume >= minimumVolume) sell = true;
    } else if (level.sellVolume / denom >= ratio) {
      sell = true;
    }
  }

  return { buy, sell };
}

/** Apply imbalance flags to every level of a candle (mutates levels in place). */
export function calculateImbalances(
  candle: FootprintCandle,
  settings: ImbalanceSettings
): void {
  const levels = candle.levels;
  for (let i = 0; i < levels.length; i++) {
    const result =
      settings.mode === 'samePrice'
        ? detectSamePriceImbalance(levels[i], settings)
        : detectDiagonalImbalance(levels, i, settings);
    levels[i].buyImbalance = result.buy;
    levels[i].sellImbalance = result.sell;
    // clear previous stack flags; stacks are applied separately
    levels[i].buyStack = false;
    levels[i].sellStack = false;
  }
}

/**
 * Consecutive same-side stacks by tickIndex continuity.
 * Missing price levels break the stack — visual adjacency is ignored.
 */
export function detectImbalanceStacks(
  candle: FootprintCandle,
  settings: ImbalanceSettings
): ImbalanceStack[] {
  const { stackLevels } = settings;
  if (stackLevels < 2) return [];

  const levels = [...candle.levels].sort((a, b) => a.tickIndex - b.tickIndex);
  const stacks: ImbalanceStack[] = [];

  const walk = (side: Side) => {
    let runStart = -1;
    let runLen = 0;
    let prevTick: number | null = null;

    const flush = () => {
      if (runLen >= stackLevels && runStart >= 0) {
        const startL = levels[runStart];
        const endL = levels[runStart + runLen - 1];
        stacks.push({
          side,
          startPrice: startL.price,
          endPrice: endL.price,
          levels: runLen,
          candleId: candle.id,
        });
        // mark levels
        for (let k = runStart; k < runStart + runLen; k++) {
          if (side === 'buy') levels[k].buyStack = true;
          else levels[k].sellStack = true;
        }
      }
    };

    for (let i = 0; i < levels.length; i++) {
      const l = levels[i];
      const isImb = side === 'buy' ? !!l.buyImbalance : !!l.sellImbalance;
      const consecutive = prevTick === null || l.tickIndex === prevTick + 1;

      if (isImb && consecutive) {
        if (runStart < 0) runStart = i;
        runLen++;
        prevTick = l.tickIndex;
      } else {
        flush();
        if (isImb) {
          runStart = i;
          runLen = 1;
          prevTick = l.tickIndex;
        } else {
          runStart = -1;
          runLen = 0;
          prevTick = null;
        }
      }
    }
    flush();
  };

  walk('buy');
  walk('sell');

  // write stack flags back onto original (same object references)
  const byTick = new Map(candle.levels.map((l) => [l.tickIndex, l]));
  for (const l of levels) {
    const orig = byTick.get(l.tickIndex);
    if (orig) {
      orig.buyStack = l.buyStack;
      orig.sellStack = l.sellStack;
    }
  }

  return stacks;
}

/** Full pipeline: imbalances then stacks for a list of candles. */
export function applyImbalancePipeline(
  candles: FootprintCandle[],
  settings: ImbalanceSettings
): ImbalanceStack[] {
  const allStacks: ImbalanceStack[] = [];
  for (const c of candles) {
    calculateImbalances(c, settings);
    if (settings.showHighlights) {
      allStacks.push(...detectImbalanceStacks(c, settings));
    }
  }
  return allStacks;
}
