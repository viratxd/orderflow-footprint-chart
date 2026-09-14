import { useEffect, useRef } from 'react';
import { FootprintCanvasController } from './FootprintCanvas';
import { FootprintTooltip } from './FootprintTooltip';
import { FootprintToolbar } from './FootprintToolbar';
import { useFootprintStore } from './hooks/useFootprintData';
import { useFootprintViewport } from './hooks/useFootprintViewport';
import type {
  FootprintCandle,
  FootprintSettings,
  Trade,
  Timeframe,
  DisplayMode,
  ImbalanceMode,
} from './FootprintTypes';
import { DEFAULT_SETTINGS } from './FootprintTypes';

export interface FootprintChartProps {
  candles?: FootprintCandle[];
  trades?: Trade[];
  tickSize?: number;
  timeframe?: Timeframe;
  settings?: {
    displayMode?: DisplayMode;
    imbalanceMode?: ImbalanceMode;
    imbalanceRatio?: number;
    minimumVolume?: number;
    stackLevels?: number;
    showImbalances?: boolean;
    showStacks?: boolean;
  };
  height?: number | string;
  width?: number | string;
  symbol?: string;
  showToolbar?: boolean;
  className?: string;
}

function mapSettings(s?: FootprintChartProps['settings']): Partial<FootprintSettings> {
  if (!s) return {};
  return {
    displayMode: s.displayMode ?? DEFAULT_SETTINGS.displayMode,
    showStacks: s.showStacks ?? true,
    imbalance: {
      ...DEFAULT_SETTINGS.imbalance,
      mode: s.imbalanceMode ?? DEFAULT_SETTINGS.imbalance.mode,
      ratio: s.imbalanceRatio ?? DEFAULT_SETTINGS.imbalance.ratio,
      minimumVolume: s.minimumVolume ?? DEFAULT_SETTINGS.imbalance.minimumVolume,
      stackLevels: s.stackLevels ?? DEFAULT_SETTINGS.imbalance.stackLevels,
      showHighlights: s.showImbalances ?? true,
    },
  };
}

export function FootprintChart({
  candles,
  trades,
  tickSize = 0.5,
  timeframe = '1m',
  settings,
  height = 600,
  width = '100%',
  symbol = '',
  showToolbar = true,
  className,
}: FootprintChartProps) {
  const store = useFootprintStore({
    candles,
    trades,
    tickSize,
    timeframe,
    settings: mapSettings(settings),
    symbol,
  });
  const { fit, reset } = useFootprintViewport(store);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<FootprintCanvasController | null>(null);

  // mount controller once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctrl = new FootprintCanvasController(canvas, store);
    controllerRef.current = ctrl;
    return () => {
      ctrl.dispose();
      controllerRef.current = null;
    };
  }, [store]);

  // size observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      store.setSize(cr.width, cr.height);
      // first fit
      if (store.getState().candles.length && store.getState().viewport.scaleX === 1) {
        store.fitViewport();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [store]);

  // fit when data first arrives
  useEffect(() => {
    const unsub = store.subscribe(() => {
      const s = store.getState();
      if (s.candles.length && s.viewport.scaleX <= 1.0001) {
        store.fitViewport();
      }
    });
    return unsub;
  }, [store]);

  const state = store.getState();

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        height,
        background: '#0d1117',
        border: '1px solid #21262d',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {showToolbar && (
        <FootprintToolbar
          settings={state.settings}
          onChange={(p) => store.setSettings(p)}
          onFit={fit}
          onReset={reset}
        />
      )}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
        />
        <FootprintTooltip
          crosshair={state.crosshair}
          candles={state.candles}
          tickSize={state.tickSize}
          symbol={state.symbol}
          containerWidth={state.width}
        />
      </div>
    </div>
  );
}

export default FootprintChart;
