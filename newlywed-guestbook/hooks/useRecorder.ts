"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LIMITS } from "@/lib/config";

export type RecorderState = "idle" | "recording" | "recorded";

const BARS = 24;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

export function useRecorder(onRecordingChange?: (recording: boolean) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.08));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const finalSecondsRef = useRef(0);
  const urlRef = useRef<string | null>(null);
  const cbRef = useRef(onRecordingChange);
  cbRef.current = onRecordingChange;

  const teardown = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setLevels(Array(BARS).fill(0.08));
  }, []);

  const revoke = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  useEffect(
    () => () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.onstop = null;
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
      teardown();
      revoke();
      cbRef.current?.(false);
    },
    [teardown, revoke]
  );

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      finalSecondsRef.current = Math.min(
        LIMITS.maxVoiceSeconds,
        (Date.now() - startedAtRef.current) / 1000
      );
      rec.stop();
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Your browser can't record audio. Try Chrome, Safari 14.5+ or Firefox.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || mime || "audio/webm";
        const b = new Blob(chunksRef.current, { type });
        revoke();
        const u = URL.createObjectURL(b);
        urlRef.current = u;
        setBlob(b);
        setUrl(u);
        setSeconds(Math.round(finalSecondsRef.current));
        setState("recorded");
        teardown();
        cbRef.current?.(false);
      };

      // live visualiser
      const AC: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let frame = 0;
      const tick = () => {
        analyser.getByteFrequencyData(data);
        if (frame++ % 3 === 0) {
          setLevels(Array.from({ length: BARS }, (_, i) => Math.max(0.08, (data[i] ?? 0) / 255)));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      startedAtRef.current = Date.now();
      setSeconds(0);
      setState("recording");
      cbRef.current?.(true);
      rec.start(250);

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        setSeconds(Math.floor(elapsed));
        if (elapsed >= LIMITS.maxVoiceSeconds) stop();
      }, 250);
    } catch (e) {
      teardown();
      cbRef.current?.(false);
      const name = (e as DOMException)?.name;
      setError(
        name === "NotAllowedError"
          ? "Microphone permission was blocked. Please allow it in your browser settings and try again."
          : "We couldn't start the microphone. Please try again."
      );
      setState("idle");
    }
  }, [revoke, stop, teardown]);

  const reset = useCallback(() => {
    revoke();
    setBlob(null);
    setUrl(null);
    setSeconds(0);
    setError(null);
    setState("idle");
  }, [revoke]);

  return { state, seconds, blob, url, error, levels, start, stop, reset };
}
