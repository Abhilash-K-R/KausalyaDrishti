import { useEffect, useRef, useState } from 'react';

/**
 * useTicker — a resilient setInterval hook.
 * Pauses when `active === false` and when the browser tab is hidden, so the
 * edge simulation never burns CPU in a background tab (rural battery concern).
 */
export function useTicker(callback, intervalMs = 1000, active = true, deps = []) {
  const cbRef = useRef(callback);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return undefined;
    let id = null;
    const start = () => {
      if (id) return;
      id = window.setInterval(() => {
        setTick((t) => t + 1);
        if (typeof cbRef.current === 'function') cbRef.current();
      }, intervalMs);
    };
    const stop = () => {
      if (id) {
        window.clearInterval(id);
        id = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, active, ...deps]);

  return tick;
}

/**
 * useRafLoop — requestAnimationFrame loop with a fixed FPS ceiling and an
 * automatic frame counter. Returns a ref that always holds the live counter,
 * so components can read FPS without re-rendering every frame.
 */
export function useRafLoop(callback, { fps = 30, active = true } = {}) {
  const frameRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef(null);
  const cbRef = useRef(callback);
  const fpsCounter = useRef({ frames: 0, lastSample: 0, value: fps });
  const [fpsValue, setFpsValue] = useState(fps);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return undefined;
    const step = 1000 / fps;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const loop = (timestamp) => {
      rafRef.current = window.requestAnimationFrame(loop);
      const delta = timestamp - lastRef.current;
      if (delta < step - 0.5) return;
      lastRef.current = timestamp - (delta % step);
      frameRef.current += 1;
      if (typeof cbRef.current === 'function') cbRef.current(frameRef.current);

      const counter = fpsCounter.current;
      counter.frames += 1;
      if (timestamp - counter.lastSample >= 1000) {
        counter.value = Math.round((counter.frames * 1000) / (timestamp - counter.lastSample));
        counter.frames = 0;
        counter.lastSample = timestamp;
        setFpsValue(counter.value);
      }
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
    };
  }, [fps, active]);

  return { frameRef, fpsValue };
}

/** useIntervalCounter — simple seconds counter, used by live HUD clocks. */
export function useClock(active = true) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return undefined;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}
