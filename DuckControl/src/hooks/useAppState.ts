/** Background safety: when the app goes to background/inactive, immediately
 *  send zero motion and stop control. Mirrors assets/app.js visibilitychange
 *  (line 205) and pagehide/sendBeacon (lines 206–209). */

import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {useRobotStore} from '../store/robotStore';
import type {CommandPayload} from '../types/robot';

export function useAppState(active: boolean): void {
  const client = useRobotStore(s => s.client);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!client) return;

    const handleChange = (nextState: AppStateStatus) => {
      if (!activeRef.current) return;
      const inactive = nextState === 'inactive' || nextState === 'background';
      if (inactive) {
        // Immediately zero motion and send a zero command
        const store = useRobotStore.getState();
        store.zeroMotion();
        // Fire-and-forget zero command (like sendBeacon)
        client
          .command({twist: [0, 0, 0], head: [0, 0, 0, 0], mouth: 0} as CommandPayload)
          .catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [client]);
}

/** Returns true when the app is in the foreground (active state). */
export function useForeground(): boolean {
  const fgRef = useRef(true);
  const forceUpdate = useForceUpdate();
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      fgRef.current = state === 'active';
      forceUpdate();
    });
    return () => sub.remove();
  }, [forceUpdate]);
  return fgRef.current;
}

function useForceUpdate(): () => void {
  const [, setN] = useState(0);
  return useCallback(() => setN(n => n + 1), []);
}
