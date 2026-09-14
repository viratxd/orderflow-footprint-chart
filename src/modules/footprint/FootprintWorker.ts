/**
 * Optional Web Worker entry — aggregation only, no rendering.
 * Build with Vite worker import when needed:
 *   new Worker(new URL('./FootprintWorker.ts', import.meta.url), { type: 'module' })
 */
import { handleWorkerRequest, type WorkerRequest } from './FootprintEngine';

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const result = handleWorkerRequest(ev.data);
  (self as DedicatedWorkerGlobalScope).postMessage(result);
};
