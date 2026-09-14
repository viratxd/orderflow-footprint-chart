/**
 * Pure aggregation + imbalance engine.
 * Designed to run on main thread or inside a Web Worker without React/DOM.
 */
import type { Trade, FootprintCandle, AggregateOptions, ImbalanceSettings } from './FootprintTypes';
import { aggregateTradesToFootprint, replaceCandle } from './FootprintMath';
import { applyImbalancePipeline } from './FootprintImbalance';

export interface EngineInput {
  trades?: Trade[];
  candles?: FootprintCandle[];
  options: AggregateOptions;
  imbalance: ImbalanceSettings;
}

export interface EngineOutput {
  candles: FootprintCandle[];
  stacks: ReturnType<typeof applyImbalancePipeline>;
}

export function runFootprintEngine(input: EngineInput): EngineOutput {
  let candles: FootprintCandle[];
  if (input.candles?.length) {
    candles = input.candles.map((c) => ({
      ...c,
      levels: c.levels.map((l) => ({ ...l })),
    }));
  } else if (input.trades?.length) {
    candles = aggregateTradesToFootprint(input.trades, input.options);
  } else {
    candles = [];
  }
  const stacks = applyImbalancePipeline(candles, input.imbalance);
  return { candles, stacks };
}

export function mergeFinalizedCandle(
  candles: FootprintCandle[],
  snapshot: FootprintCandle
): FootprintCandle[] {
  return replaceCandle(candles, snapshot);
}

/** Message protocol for future FootprintWorker.ts */
export type WorkerRequest =
  | { type: 'aggregate'; trades: Trade[]; options: AggregateOptions; imbalance: ImbalanceSettings }
  | { type: 'finalize'; candles: FootprintCandle[]; snapshot: FootprintCandle; imbalance: ImbalanceSettings };

export type WorkerResponse =
  | { type: 'result'; candles: FootprintCandle[]; stacks: EngineOutput['stacks'] }
  | { type: 'error'; message: string };

export function handleWorkerRequest(req: WorkerRequest): WorkerResponse {
  try {
    if (req.type === 'aggregate') {
      const out = runFootprintEngine({
        trades: req.trades,
        options: req.options,
        imbalance: req.imbalance,
      });
      return { type: 'result', candles: out.candles, stacks: out.stacks };
    }
    if (req.type === 'finalize') {
      const candles = mergeFinalizedCandle(req.candles, req.snapshot);
      const stacks = applyImbalancePipeline(candles, req.imbalance);
      return { type: 'result', candles, stacks };
    }
    return { type: 'error', message: 'unknown request' };
  } catch (e) {
    return { type: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}
