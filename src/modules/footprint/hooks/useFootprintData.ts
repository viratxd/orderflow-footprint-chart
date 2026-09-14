import { useEffect, useRef, useState, useCallback } from 'react';
import { FootprintStore } from '../FootprintStore';
import type { FootprintCandle, FootprintSettings, Trade, Timeframe } from '../FootprintTypes';

export interface UseFootprintDataOptions {
  candles?: FootprintCandle[];
  trades?: Trade[];
  tickSize?: number;
  timeframe?: Timeframe;
  settings?: Partial<FootprintSettings>;
  symbol?: string;
}

export function useFootprintStore(options: UseFootprintDataOptions = {}) {
  const storeRef = useRef<FootprintStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new FootprintStore({
      tickSize: options.tickSize ?? 0.5,
      timeframe: options.timeframe ?? '1m',
      symbol: options.symbol ?? '',
    });
  }
  const store = storeRef.current;
  const [, bump] = useState(0);
  const force = useCallback(() => bump((n) => n + 1), []);

  useEffect(() => store.subscribe(force), [store, force]);

  useEffect(() => {
    if (options.tickSize != null) store.setTickSize(options.tickSize);
  }, [options.tickSize, store]);

  useEffect(() => {
    if (options.timeframe) store.setTimeframe(options.timeframe);
  }, [options.timeframe, store]);

  useEffect(() => {
    if (options.symbol != null) store.setSymbol(options.symbol);
  }, [options.symbol, store]);

  useEffect(() => {
    if (options.settings) store.setSettings(options.settings);
  }, [options.settings, store]);

  useEffect(() => {
    if (options.candles) store.setCandles(options.candles);
  }, [options.candles, store]);

  useEffect(() => {
    if (options.trades) store.loadTrades(options.trades);
  }, [options.trades, store]);

  return store;
}
