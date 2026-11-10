"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, RotateCcw, Square, Trash2 } from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";
import { useMusic } from "@/components/MusicProvider";
import { LIMITS } from "@/lib/config";
import { formatClock } from "@/lib/utils";
import type { VoiceDraft } from "@/lib/types";

type Props = {
  voice: VoiceDraft | null;
  onChange: (v: VoiceDraft | null) => void;
};

export default function VoiceSection({ voice, onChange }: Props) {
  const { duck } = useMusic();
  const rec = useRecorder((recording) => duck(recording));

  // push a finished recording up to the form
  useEffect(() => {
    if (rec.state === "recorded" && rec.blob) {
      onChange({ blob: rec.blob, durationSeconds: rec.seconds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.state, rec.blob]);

  const hasRecording = rec.state === "recorded" && rec.url;
  const progress = Math.min(100, (rec.seconds / LIMITS.maxVoiceSeconds) * 100);

  return (
    <div className="mx-auto max-w-xl text-center">
      <h3 className="font-display text-2xl">Say it out loud</h3>
      <p className="mt-2 font-serif text-lg italic text-cocoa/70">
        Record a voice message up to {LIMITS.maxVoiceSeconds} seconds. The background music pauses while you record.
      </p>

      <div className="paper relative mt-8 rounded-2xl p-6 shadow-paper">
        {/* visualiser */}
        <div className="flex h-24 items-center justify-center gap-[5px]" aria-hidden>
          {rec.levels.map((l, i) => (
            <motion.span
              key={i}
              className="w-[5px] rounded-full bg-gradient-to-t from-gold-dark to-gold-light"
              animate={{ height: `${Math.round(l * 100)}%` }}
              transition={{ duration: 0.12 }}
              style={{ minHeight: 6 }}
            />
          ))}
        </div>

        <div className="mt-2 font-display text-3xl tabular-nums">
          {formatClock(rec.seconds)} <span className="text-base text-cocoa/40">/ {formatClock(LIMITS.maxVoiceSeconds)}</span>
        </div>
        <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-champagne">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {rec.state === "idle" && (
            <button type="button" className="btn-gold" onClick={rec.start}>
              <Mic size={18} /> {voice ? "Record again" : "Start recording"}
            </button>
          )}
          {rec.state === "recording" && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-rose-deep px-7 py-3.5 text-sm font-semibold text-white shadow-lg"
              onClick={rec.stop}
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                <Square size={12} className="relative fill-white" />
              </span>
              Stop
            </button>
          )}
          {hasRecording && (
            <>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  rec.reset();
                  onChange(null);
                }}
              >
                <RotateCcw size={16} /> Re-record
              </button>
              <button
                type="button"
                className="btn-ghost text-rose-deep"
                onClick={() => {
                  rec.reset();
                  onChange(null);
                }}
              >
                <Trash2 size={16} /> Remove
              </button>
            </>
          )}
        </div>

        {hasRecording && rec.url && (
          <div className="mt-5">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio src={rec.url} controls className="mx-auto w-full max-w-sm" onPlay={() => duck(true)} onPause={() => duck(false)} onEnded={() => duck(false)} />
          </div>
        )}

        {rec.error && <p className="mt-4 text-sm text-rose-deep">{rec.error}</p>}
      </div>

      <p className="mt-4 text-xs text-cocoa/50">Voice notes are optional and private &mdash; only the couple can hear them.</p>
    </div>
  );
}
