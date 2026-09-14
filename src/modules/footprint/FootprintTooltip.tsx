import type { CrosshairState, FootprintCandle, FootprintLevel } from './FootprintTypes';
import { formatVolume, formatDelta, formatPrice } from './FootprintMath';

interface Props {
  crosshair: CrosshairState;
  candles: FootprintCandle[];
  tickSize: number;
  symbol: string;
  containerWidth: number;
}

export function FootprintTooltip({ crosshair, candles, tickSize, symbol, containerWidth }: Props) {
  if (!crosshair.visible || !crosshair.candleId) return null;
  const candle = candles.find((c) => c.id === crosshair.candleId);
  if (!candle) return null;
  const level: FootprintLevel | null = crosshair.level;
  const time = new Date(candle.startTime).toISOString().slice(11, 16);

  const left = Math.min(crosshair.x + 12, containerWidth - 200);
  const top = Math.max(8, crosshair.y - 80);

  return (
    <div
      className="fp-tooltip"
      style={{
        position: 'absolute',
        left,
        top,
        pointerEvents: 'none',
        zIndex: 10,
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#e6edf3',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        minWidth: 160,
      }}
    >
      <div style={{ color: '#58a6ff', marginBottom: 4, fontWeight: 600 }}>
        {symbol || 'FOOTPRINT'} · {time}
        {!candle.completed && <span style={{ color: '#d29922', marginLeft: 6 }}>LIVE</span>}
      </div>
      <div>Price: {formatPrice(crosshair.price ?? 0, tickSize)}</div>
      {level ? (
        <>
          <div style={{ color: '#3fb950' }}>Buy: {formatVolume(level.buyVolume)}</div>
          <div style={{ color: '#f85149' }}>Sell: {formatVolume(level.sellVolume)}</div>
          <div style={{ color: level.delta >= 0 ? '#3fb950' : '#f85149' }}>
            Delta: {formatDelta(level.delta)}
          </div>
          <div>Total: {formatVolume(level.totalVolume)}</div>
          {(level.buyImbalance || level.sellImbalance) && (
            <div style={{ marginTop: 4, color: level.buyImbalance ? '#56d364' : '#ff7b72' }}>
              {level.buyStack || level.sellStack
                ? `STACK ${level.buyStack ? 'BUY' : 'SELL'}`
                : `IMBALANCE ${level.buyImbalance ? 'BUY' : 'SELL'}`}
            </div>
          )}
        </>
      ) : (
        <div style={{ color: '#8b949e' }}>No volume at level</div>
      )}
    </div>
  );
}
