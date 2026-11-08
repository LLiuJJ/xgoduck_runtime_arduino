/** Sends POST /api/command every 50ms with the latest twist/head/mouth.
 *  Mirrors assets/app.js line 210 setInterval(…, 50) and the command logic
 *  in sendCommand() (lines 126–135), including busy/pending anti-concurrency. */

import {useEffect, useRef} from 'react';
import {useRobotStore} from '../store/robotStore';
import type {CommandPayload, Vec4} from '../types/robot';

const COMMAND_INTERVAL = 50; // ms

export function useCommandLoop(enabled: boolean): void {
  const client = useRobotStore(s => s.client);
  const imuCalibrationActive = useRobotStore(s => s.imuCalibrationActive);
  const controlModeAvailable = useRobotStore(s => s.controlModeAvailable);
  const busyRef = useRef(false);
  const pendingRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!client) return;

    const send = async () => {
      if (
        !enabledRef.current ||
        imuCalibrationActive ||
        !controlModeAvailable ||
        !useRobotStore.getState().connected
      ) {
        return;
      }
      if (busyRef.current) {
        pendingRef.current = true;
        return;
      }
      busyRef.current = true;
      pendingRef.current = false;

      const store = useRobotStore.getState();
      // smoothMotion updates store.motion and returns the smoothed value
      const twist = store.smoothMotion();
      const head = (imuCalibrationActive ? [0, 0, 0, 0] : store.head) as Vec4;
      const mouth = imuCalibrationActive ? 0 : store.mouth;

      try {
        await client.command({twist, head, mouth} as CommandPayload);
      } catch {
        // Errors are surfaced by status polling; swallow here to avoid spam.
      } finally {
        busyRef.current = false;
        if (pendingRef.current) {
          send();
        }
      }
    };

    const id = setInterval(send, COMMAND_INTERVAL);
    return () => clearInterval(id);
  }, [client, imuCalibrationActive, controlModeAvailable]);
}
