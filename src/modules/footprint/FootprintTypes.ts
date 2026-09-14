/** Normalized order-flow footprint models — exchange / instrument agnostic. */

export type Side = 'buy' | 'sell';
export type DisplayMode = 'bidAsk' | 'delta' | 'total';
export type ImbalanceMode = 'samePrice' | 'diagonal';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | string;

export interface Trade {
  timestamp: number;
  price: number;
  quantity: number;
  side: Side;
}

export interface FootprintLevel {
  price: number;
  tickIndex: number;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  delta: number;
  buyImbalance?: boolean;
  sellImbalance?: boolean;
  buyStack?: boolean;
  sellStack?: boolean;
}

export interface FootprintCandle {
  id: string;
  startTime: number;
  endTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  levels: FootprintLevel[];
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
  completed: boolean;
}

export interface ImbalanceSettings {
  mode: ImbalanceMode;
  ratio: number;
  minimumVolume: number;
  stackLevels: number;
  showHighlights: boolean;
}

export interface FootprintSettings {
  displayMode: DisplayMode;
  imbalance: ImbalanceSettings;
  showStacks: boolean;
  showCandleBody: boolean;
  showGrid: boolean;
  rowHeight: number;
  candleWidth: number;
  padding: number;
}

export const DEFAULT_IMBALANCE: ImbalanceSettings = {
  mode: 'diagonal',
  ratio: 3,
  minimumVolume: 1,
  stackLevels: 3,
  showHighlights: true,
};

export const DEFAULT_SETTINGS: FootprintSettings = {
  displayMode: 'bidAsk',
  imbalance: { ...DEFAULT_IMBALANCE },
  showStacks: true,
  showCandleBody: true,
  showGrid: true,
  rowHeight: 18,
  candleWidth: 72,
  padding: 4,
};

export interface ImbalanceStack {
  side: Side;
  startPrice: number;
  endPrice: number;
  levels: number;
  candleId: string;
}

export interface ViewportState {
  /** leftmost candle startTime visible */
  timeMin: number;
  timeMax: number;
  /** price range visible */
  priceMin: number;
  priceMax: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export interface CrosshairState {
  visible: boolean;
  x: number;
  y: number;
  candleId: string | null;
  price: number | null;
  level: FootprintLevel | null;
}

export interface FootprintTheme {
  background: string;
  grid: string;
  text: string;
  textMuted: string;
  buy: string;
  sell: string;
  deltaPositive: string;
  deltaNegative: string;
  imbalanceBuy: string;
  imbalanceSell: string;
  stackBuy: string;
  stackSell: string;
  formingBorder: string;
  candleBody: string;
  candleWick: string;
  crosshair: string;
  tooltipBg: string;
  tooltipBorder: string;
}

export const DARK_THEME: FootprintTheme = {
  background: '#0d1117',
  grid: '#21262d',
  text: '#e6edf3',
  textMuted: '#8b949e',
  buy: '#3fb950',
  sell: '#f85149',
  deltaPositive: '#3fb950',
  deltaNegative: '#f85149',
  imbalanceBuy: '#56d364',
  imbalanceSell: '#ff7b72',
  stackBuy: '#2ea043',
  stackSell: '#da3633',
  formingBorder: '#58a6ff',
  candleBody: '#30363d',
  candleWick: '#8b949e',
  crosshair: '#58a6ff',
  tooltipBg: '#161b22',
  tooltipBorder: '#30363d',
};

export interface AggregateOptions {
  tickSize: number;
  timeframeMs: number;
  startTime?: number;
}

export type TimeframeMsMap = Record<string, number>;

export const TIMEFRAME_MS: TimeframeMsMap = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
};
