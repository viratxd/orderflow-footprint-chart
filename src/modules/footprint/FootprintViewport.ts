import type { FootprintCandle, ViewportState } from './FootprintTypes';

export function createDefaultViewport(): ViewportState {
  return {
    timeMin: 0,
    timeMax: 1,
    priceMin: 0,
    priceMax: 1,
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

export function fitToData(
  candles: FootprintCandle[],
  width: number,
  height: number,
  candleWidth: number,
  rowHeight: number,
  padding: number
): ViewportState {
  if (!candles.length) return createDefaultViewport();

  const timeMin = candles[0].startTime;
  const timeMax = candles[candles.length - 1].endTime;
  let priceMin = Infinity;
  let priceMax = -Infinity;
  for (const c of candles) {
    priceMin = Math.min(priceMin, c.low);
    priceMax = Math.max(priceMax, c.high);
  }
  if (!Number.isFinite(priceMin)) {
    priceMin = 0;
    priceMax = 1;
  }
  // small padding on price
  const pricePad = (priceMax - priceMin) * 0.05 || 1;
  priceMin -= pricePad;
  priceMax += pricePad;

  const usableW = Math.max(1, width - padding * 2);
  const usableH = Math.max(1, height - padding * 2);
  const spanT = Math.max(1, timeMax - timeMin);
  const spanP = Math.max(1e-12, priceMax - priceMin);

  // prefer fixed candle/row sizes when possible
  const scaleX = Math.min(candleWidth / ((timeMax - timeMin) / candles.length || 1), usableW / spanT);
  const scaleY = usableH / spanP;

  return {
    timeMin,
    timeMax,
    priceMin,
    priceMax,
    scaleX,
    scaleY,
    offsetX: padding - timeMin * scaleX,
    offsetY: padding + priceMax * scaleY, // y grows downward; price high at top
  };
}

export function timeToX(t: number, vp: ViewportState): number {
  return t * vp.scaleX + vp.offsetX;
}

export function xToTime(x: number, vp: ViewportState): number {
  return (x - vp.offsetX) / vp.scaleX;
}

export function priceToY(price: number, vp: ViewportState): number {
  return vp.offsetY - price * vp.scaleY;
}

export function yToPrice(y: number, vp: ViewportState): number {
  return (vp.offsetY - y) / vp.scaleY;
}

export function pan(vp: ViewportState, dx: number, dy: number): ViewportState {
  return {
    ...vp,
    offsetX: vp.offsetX + dx,
    offsetY: vp.offsetY + dy,
    timeMin: vp.timeMin - dx / vp.scaleX,
    timeMax: vp.timeMax - dx / vp.scaleX,
    priceMin: vp.priceMin + dy / vp.scaleY,
    priceMax: vp.priceMax + dy / vp.scaleY,
  };
}

export function zoomAt(
  vp: ViewportState,
  factor: number,
  anchorX: number,
  anchorY: number,
  minScaleX = 1e-8,
  maxScaleX = 1e6
): ViewportState {
  const tAnchor = xToTime(anchorX, vp);
  const pAnchor = yToPrice(anchorY, vp);
  const scaleX = Math.min(maxScaleX, Math.max(minScaleX, vp.scaleX * factor));
  const scaleY = Math.min(maxScaleX, Math.max(minScaleX, vp.scaleY * factor));
  const offsetX = anchorX - tAnchor * scaleX;
  const offsetY = anchorY + pAnchor * scaleY;
  const timeMin = xToTime(0, { ...vp, scaleX, offsetX });
  const timeMax = xToTime(1, { ...vp, scaleX, offsetX }); // relative; caller may ignore
  return {
    ...vp,
    scaleX,
    scaleY,
    offsetX,
    offsetY,
    timeMin: tAnchor - (tAnchor - vp.timeMin) * (vp.scaleX / scaleX),
    timeMax: tAnchor + (vp.timeMax - tAnchor) * (vp.scaleX / scaleX),
    priceMin: pAnchor - (pAnchor - vp.priceMin) * (vp.scaleY / scaleY),
    priceMax: pAnchor + (vp.priceMax - pAnchor) * (vp.scaleY / scaleY),
  };
}

export function visibleCandles(
  candles: FootprintCandle[],
  vp: ViewportState,
  canvasWidth: number
): FootprintCandle[] {
  const t0 = xToTime(-50, vp);
  const t1 = xToTime(canvasWidth + 50, vp);
  return candles.filter((c) => c.endTime >= t0 && c.startTime <= t1);
}

export function visiblePriceRange(vp: ViewportState, canvasHeight: number): { min: number; max: number } {
  const max = yToPrice(-20, vp);
  const min = yToPrice(canvasHeight + 20, vp);
  return { min: Math.min(min, max), max: Math.max(min, max) };
}
