'use client';

import { useCallback, useEffect, useRef } from 'react';

// Polls a URL until isDone(data) is true. Network blips are ignored; API errors stop polling.
export function useJobPoll(intervalMs = 2500) {
  const timer = useRef(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(
    (url, onData, isDone) => {
      stop();
      timer.current = setInterval(async () => {
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (!res.ok) {
            stop();
            onData(null, data.error || 'Lost track of the job');
            return;
          }
          onData(data, null);
          if (isDone(data)) stop();
        } catch {
          /* transient network error: keep polling */
        }
      }, intervalMs);
    },
    [stop, intervalMs]
  );

  useEffect(() => stop, [stop]);
  return { start, stop };
}
