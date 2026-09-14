import { useCallback } from 'react';
import type { FootprintStore } from '../FootprintStore';
import { createDefaultViewport } from '../FootprintViewport';

export function useFootprintViewport(store: FootprintStore) {
  const fit = useCallback(() => store.fitViewport(), [store]);
  const reset = useCallback(() => {
    store.setViewport(createDefaultViewport());
    store.fitViewport();
  }, [store]);
  return { fit, reset };
}
