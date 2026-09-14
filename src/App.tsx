import { useMemo, useState, useEffect, useCallback } from 'react';
import { FootprintChart } from './modules/footprint';
import { buildDemoCandles, generateTrades } from './demo/mockData';
import type { Trade } from './modules/footprint';

export default function App() {
  const staticCandles = useMemo(() => buildDemoCandles(), []);
  const [mode, setMode] = useState<'static' | 'live'>('static');
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (mode !== 'live') return;
    const seed = generateTrades(200);
    setLiveTrades(seed);
    let price = seed[seed.length - 1]?.price ?? 100;
    let t = seed[seed.length - 1]?.timestamp ?? Date.now();
    const id = setInterval(() => {
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const qty = Math.round((Math.random() * 30 + 2) * 10) / 10;
      price = Math.round((price + (Math.random() - 0.5) * 0.6) / 0.5) * 0.5;
      t += 400 + Math.floor(Math.random() * 600);
      setLiveTrades((prev) => [...prev, { timestamp: t, price, quantity: qty, side }]);
    }, 500);
    return () => clearInterval(id);
  }, [mode]);

  const btn = (active: boolean): React.CSSProperties => ({
    background: active ? '#388bfd33' : '#21262d',
    border: `1px solid ${active ? '#58a6ff' : '#30363d'}`,
    color: active ? '#58a6ff' : '#e6edf3',
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 13,
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Order Flow Footprint Chart</h1>
        <span style={{ color: '#8b949e', fontSize: 13 }}>React · Canvas · TypeScript</span>
        <div style={{ flex: 1 }} />
        <button style={btn(mode === 'static')} onClick={() => setMode('static')}>
          Demo Scenarios
        </button>
        <button style={btn(mode === 'live')} onClick={() => setMode('live')}>
          Live Forming
        </button>
      </header>

      <p style={{ color: '#8b949e', fontSize: 13, margin: 0 }}>
        {mode === 'static'
          ? 'Static fixtures: balanced · buy imbalance · sell imbalance · 3-level stack · sparse gaps · forming candle'
          : 'Streaming synthetic trades — forming candle updates incrementally'}
      </p>

      <div style={{ flex: 1, minHeight: 0 }}>
        {mode === 'static' ? (
          <FootprintChart
            candles={staticCandles}
            tickSize={0.5}
            timeframe="1m"
            symbol="DEMOUSDT"
            height="100%"
            settings={{
              displayMode: 'bidAsk',
              imbalanceMode: 'diagonal',
              imbalanceRatio: 3,
              stackLevels: 3,
              showImbalances: true,
              showStacks: true,
            }}
          />
        ) : (
          <FootprintChart
            trades={liveTrades}
            tickSize={0.5}
            timeframe="1m"
            symbol="LIVEUSDT"
            height="100%"
            settings={{
              displayMode: 'bidAsk',
              imbalanceMode: 'diagonal',
              imbalanceRatio: 3,
              stackLevels: 3,
              showImbalances: true,
            }}
          />
        )}
      </div>
    </div>
  );
}
