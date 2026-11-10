"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type MusicContextValue = {
  playing: boolean;
  toggle: () => void;
  /** Silence the background track temporarily (previews, voice recording). */
  duck: (on: boolean) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

const STORAGE_KEY = "guestbook-music-muted";
const TARGET_VOLUME = 0.32;
const SRC = "/lagu-baru.mp3";

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(false);
  const duckCountRef = useRef(0);
  const fadeRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const fadeTo = useCallback((target: number, ms = 600) => {
    const a = audioRef.current;
    if (!a) return;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    const from = a.volume;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      a.volume = Math.min(1, Math.max(0, from + (target - from) * p));
      if (p < 1) fadeRef.current = requestAnimationFrame(step);
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const tryPlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a || mutedRef.current) return false;
    try {
      a.volume = 0;
      await a.play();
      setPlaying(true);
      fadeTo(duckCountRef.current > 0 ? 0 : TARGET_VOLUME, 1800);
      return true;
    } catch {
      return false; // autoplay blocked: wait for a gesture
    }
  }, [fadeTo]);

  useEffect(() => {
    const a = new Audio(SRC);
    a.loop = true;
    a.preload = "auto";
    audioRef.current = a;

    try {
      mutedRef.current = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* private mode */
    }

    const events: Array<keyof WindowEventMap> = ["pointerdown", "touchstart", "keydown", "scroll"];
    const detach = () => events.forEach((e) => window.removeEventListener(e, onGesture));
    async function onGesture() {
      if (mutedRef.current) return;
      if (await tryPlay()) detach();
    }

    tryPlay().then((ok) => {
      if (!ok && !mutedRef.current) events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    });

    return () => {
      detach();
      if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
  }, [tryPlay]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.paused) {
      mutedRef.current = true;
      a.pause();
      setPlaying(false);
    } else {
      mutedRef.current = false;
      tryPlay();
    }
    try {
      localStorage.setItem(STORAGE_KEY, mutedRef.current ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [tryPlay]);

  const duck = useCallback(
    (on: boolean) => {
      duckCountRef.current = Math.max(0, duckCountRef.current + (on ? 1 : -1));
      const a = audioRef.current;
      if (!a || a.paused) return;
      fadeTo(duckCountRef.current > 0 ? 0 : TARGET_VOLUME, 500);
    },
    [fadeTo]
  );

  const value = useMemo(() => ({ playing, toggle, duck }), [playing, toggle, duck]);
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
  return ctx;
}
