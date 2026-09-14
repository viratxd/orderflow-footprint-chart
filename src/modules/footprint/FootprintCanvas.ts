import { FootprintRenderer, type RenderContext } from './FootprintRenderer';
import type { FootprintStore } from './FootprintStore';
import { pan, zoomAt, timeToX, priceToY } from './FootprintViewport';

/**
 * Owns the canvas element, rAF loop, and pointer interaction.
 * React only mounts/unmounts this controller.
 */
export class FootprintCanvasController {
  private renderer: FootprintRenderer;
  private store: FootprintStore;
  private raf = 0;
  private dirty = true;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private disposed = false;
  private canvas: HTMLCanvasElement;
  private unsub: () => void;

  constructor(canvas: HTMLCanvasElement, store: FootprintStore) {
    this.canvas = canvas;
    this.store = store;
    this.renderer = new FootprintRenderer(canvas);
    this.unsub = store.subscribe(() => this.markDirty());
    this.bindEvents();
    this.loop();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.unsub();
    this.unbindEvents();
  }

  markDirty() {
    this.dirty = true;
  }

  private loop = () => {
    if (this.disposed) return;
    if (this.dirty) {
      this.dirty = false;
      this.renderFrame();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private renderFrame() {
    const s = this.store.getState();
    this.renderer.resize(s.width, s.height);
    const rc: RenderContext = {
      candles: s.candles,
      settings: s.settings,
      viewport: s.viewport,
      crosshair: s.crosshair,
      width: s.width,
      height: s.height,
      tickSize: s.tickSize,
      symbol: s.symbol,
    };
    this.renderer.draw(rc);
  }

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private unbindEvents() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }

  private onPointerDown = (e: PointerEvent) => {
    this.dragging = true;
    this.lastX = e.offsetX;
    this.lastY = e.offsetY;
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerUp = (e: PointerEvent) => {
    this.dragging = false;
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  private onPointerLeave = () => {
    this.store.clearCrosshair();
  };

  private onPointerMove = (e: PointerEvent) => {
    const x = e.offsetX;
    const y = e.offsetY;
    if (this.dragging) {
      const dx = x - this.lastX;
      const dy = y - this.lastY;
      this.lastX = x;
      this.lastY = y;
      const vp = pan(this.store.getState().viewport, dx, dy);
      this.store.setViewport(vp);
      return;
    }

    const s = this.store.getState();
    const rc: RenderContext = {
      candles: s.candles,
      settings: s.settings,
      viewport: s.viewport,
      crosshair: s.crosshair,
      width: s.width,
      height: s.height,
      tickSize: s.tickSize,
      symbol: s.symbol,
    };
    const hit = this.renderer.hitTest(x, y, rc);
    this.store.setCrosshair({
      visible: true,
      x,
      y,
      candleId: hit.candle?.id ?? null,
      price: hit.price,
      level: hit.level,
    });
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const vp = zoomAt(this.store.getState().viewport, factor, e.offsetX, e.offsetY);
    this.store.setViewport(vp);
  };
}
