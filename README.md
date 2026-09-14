# Order Flow Footprint Chart

Production-quality, reusable **order-flow footprint** module for React + TypeScript + Vite.

Canvas-rendered (no per-cell DOM), imbalance mathematics (same-price + diagonal), consecutive stacked imbalances, virtualization-friendly viewport, and incremental live updates.

## Quick start

```bash
npm install
npm run dev
```

Open the demo: static scenarios + live forming candle.

```bash
npm test
```

## Install as module

```ts
import {
  FootprintChart,
  aggregateTradesToFootprint,
  calculateImbalances,
  detectImbalanceStacks,
  useFootprintStore,
} from './modules/footprint';
```

### Component API

```tsx
<FootprintChart
  candles={candles}          // or trades={rawTrades}
  tickSize={0.5}
  timeframe="1m"
  symbol="BTCUSDT"
  height={600}
  settings={{
    displayMode: 'bidAsk',   // 'bidAsk' | 'delta' | 'total'
    imbalanceMode: 'diagonal', // 'samePrice' | 'diagonal'
    imbalanceRatio: 3,
    minimumVolume: 1,
    stackLevels: 3,
    showImbalances: true,
    showStacks: true,
  }}
/>
```

### Data model

- `FootprintCandle` — time interval with OHLC + `levels[]`
- `FootprintLevel` — per-price buy/sell/total/delta + imbalance flags
- Gaps are preserved; missing intervals are never fabricated

### Live streaming

```ts
const store = useFootprintStore({ tickSize: 0.5, timeframe: '1m' });
store.appendTrade({ timestamp, price, quantity, side: 'buy' });
store.finalizeCandle(authoritativeSnapshot); // replaces forming data
```

### Architecture

```
React (config / lifecycle / toolbar / tooltip)
  → FootprintStore (normalized model, incremental updates)
    → FootprintRenderer (Canvas 2D, rAF)
```

- No one-React-element-per-cell
- Only visible candles & price rows are drawn
- Aggregation engine is pure and worker-ready (`aggregateTradesToFootprint`)

### Imbalance rules

| Mode | Buy condition | Sell condition |
|------|---------------|----------------|
| samePrice | buy / sell ≥ ratio | sell / buy ≥ ratio |
| diagonal | buy(P) / sell(P−tick) ≥ ratio | sell(P) / buy(P+tick) ≥ ratio |

Stacks require **consecutive tick indices** (gaps break the run).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit suite |

## License

MIT — independent of any exchange or proprietary backend.
