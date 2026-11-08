/** Polls GET /api/status every 250ms.
 *  Mirrors assets/app.js line 211 setInterval(…, 250). */

import {useEffect, useRef} from 'react';
import {useRobotStore} from '../store/robotStore';
import {ApiError} from '../api/client';

const POLL_INTERVAL = 250; // ms

export function useStatusPolling(enabled: boolean): void {
  const client = useRobotStore(s => s.client);
  const setStatus = useRobotStore(s => s.setStatus);
  const setConnected = useRobotStore(s => s.setConnected);
  const setMessage = useRobotStore(s => s.setMessage);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled || !client) return;

    let cancelled = false;

    const poll = async () => {
      if (busyRef.current || cancelled) return;
      busyRef.current = true;
      try {
        const s = await client.status();
        if (cancelled) return;
        setStatus(s);
        setConnected(true);
        setMessage(s.last_error || (s.control_ready ? 'Robot ready' : 'Waiting for robot…'));
      } catch (e) {
        if (cancelled) return;
        setConnected(false);
        if (e instanceof ApiError) {
          setMessage(e.message);
        } else {
          setMessage('Connection lost');
        }
      } finally {
        busyRef.current = false;
      }
    };

    poll(); // immediate first poll
    const id = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, client, setStatus, setConnected, setMessage]);
}
