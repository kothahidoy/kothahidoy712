/**
 * Bell ring/notification player.
 *
 * Web (Expo Web preview):
 *   Uses HTMLAudioElement + the Pixabay-style bell MP3 bundled in
 *   /assets/sounds/bell.mp3.  Browsers gate audio until a user gesture,
 *   so we call `primeAudioContext()` from any onPress handler before
 *   the first ring; after that autoplay works for the loop.
 *
 * Native (Expo Go / device build):
 *   Falls back to the previous synthetic-tone path (WebAudio isn't
 *   available on native).  When you publish the app, install
 *   `expo-audio` and swap `playBell` to load the same MP3 via
 *   `useAudioPlayer` — the interface here stays identical.
 */

import { Platform } from "react-native";

// Metro bundles this asset URL for web; Expo returns a require() ref
// on native which we don't use here (native path uses synthetic tones).
// Using require keeps the file colocated in /assets and avoids a
// runtime fetch to a CDN (works offline once Metro has bundled it).
const BELL_ASSET = require("../../assets/sounds/bell.mp3");

const resolveBellUrl = (): string | null => {
  try {
    if (typeof BELL_ASSET === "string") return BELL_ASSET; // web: metro returns URL string
    if (BELL_ASSET && typeof BELL_ASSET === "object" && BELL_ASSET.uri) {
      return BELL_ASSET.uri as string;
    }
    // On native, expo-asset returns a numeric module id — no direct URL.
    return null;
  } catch {
    return null;
  }
};

// ─── Web: HTMLAudioElement pool ──────────────────────────────────
let webAudioEl: HTMLAudioElement | null = null;
let loopTimer: any = null;
let synthCtx: AudioContext | null = null; // native/webaudio fallback

const ensureWebAudio = (): HTMLAudioElement | null => {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined" || typeof (window as any).Audio === "undefined") return null;
  if (!webAudioEl) {
    const url = resolveBellUrl();
    if (!url) return null;
    const a = new (window as any).Audio(url) as HTMLAudioElement;
    a.preload = "auto";
    a.volume = 0.9;
    webAudioEl = a;
  }
  return webAudioEl;
};

// Native fallback (rare code path — provider dashboard runs on web
// preview in Phase 1). Two-chirp WebAudio bell like before.
const ensureSynthCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!synthCtx) {
    try {
      synthCtx = new AC();
    } catch {
      return null;
    }
  }
  return synthCtx;
};

const playSynthBell = () => {
  const c = ensureSynthCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const now = c.currentTime;
  const chirp = (freq: number, start: number, duration = 0.16) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
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

// ─── Public API ────────────────────────────────────────────────
/**
 * Resume/create the audio pipeline. Call this from a user-gesture
 * handler (button press) so subsequent auto-play in the loop is
 * allowed by the browser.
 */
export const primeAudioContext = () => {
  if (Platform.OS === "web") {
    const a = ensureWebAudio();
    if (a) {
      // A muted play + immediate pause is a widely-supported way to
      // "warm up" HTMLAudioElement so later plays don't fail on
      // Safari/iOS. We swallow any promise rejection quietly.
      try {
        a.muted = true;
        const p = a.play();
        if (p && typeof (p as any).then === "function") {
          (p as any).then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; });
        } else {
          a.pause(); a.currentTime = 0; a.muted = false;
        }
      } catch {
        a.muted = false;
      }
      return;
    }
  }
  const c = ensureSynthCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
};

/** Play one bell ring. */
export const playBell = () => {
  if (Platform.OS === "web") {
    const a = ensureWebAudio();
    if (a) {
      try {
        a.pause();
        a.currentTime = 0;
        const p = a.play();
        if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
        return;
      } catch {
        /* fall through to synth */
      }
    }
  }
  playSynthBell();
};

/**
 * Ring bell in a loop until stopBellLoop() is called.
 * MP3 is ~1s long; we retrigger every ~1.6s to leave a natural gap.
 * Safe to call multiple times.
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
  if (Platform.OS === "web" && webAudioEl) {
    try {
      webAudioEl.pause();
      webAudioEl.currentTime = 0;
    } catch {
      /* noop */
    }
  }
};

export const isBellLooping = () => !!loopTimer;
