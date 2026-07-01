/**
 * Simple browser bell/ring player using the WebAudio API.
 *
 * Why not expo-av / an mp3 file?
 * ─────────────────────────────────
 *  • We're primarily running in web preview — WebAudio ships with the
 *    browser, no extra dependency and no round trip to fetch an mp3.
 *  • Auto-play policies still allow programmatic AudioContext.start()
 *    as long as the AudioContext was created after a user gesture.
 *  • On native, this file no-ops (the `window.AudioContext` check falls
 *    through) — we'll swap to expo-av when we publish the mobile build.
 */

let ctx: AudioContext | null = null;
let loopTimer: any = null;

const ensureCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
};

// Try to resume the AudioContext — browsers pause it until a user gesture.
export const primeAudioContext = () => {
  const c = ensureCtx();
  if (c && c.state === "suspended") {
    c.resume().catch(() => {});
  }
};

/** Play one "cring cring" bell (two short chirps + short pause). */
export const playBell = () => {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }
  const now = c.currentTime;

  // Two short chirps — 1200Hz and 1000Hz.
  const chirp = (freq: number, start: number, duration = 0.16) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    // Envelope: ramp up quickly, hold briefly, ramp down.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.6, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  chirp(1200, now);
  chirp(1000, now + 0.22);
};

/**
 * Ring bell in a loop every ~1.6s until stopBellLoop() is called.
 * Safe to call multiple times — subsequent calls no-op if a loop is
 * already running.
 */
export const startBellLoop = () => {
  if (loopTimer) return;
  playBell();
  loopTimer = setInterval(playBell, 1600);
};

export const stopBellLoop = () => {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
};

export const isBellLooping = () => !!loopTimer;
