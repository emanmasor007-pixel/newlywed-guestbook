"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, Loader2, Mic, Music2, PenLine, Send } from "lucide-react";
import WishSection from "@/components/guestbook/WishSection";
import VoiceSection from "@/components/guestbook/VoiceSection";
import PhotoSection from "@/components/guestbook/PhotoSection";
import MusicSection from "@/components/guestbook/MusicSection";
import { GoldDivider } from "@/components/Scrap";
import { submitGuestbook } from "@/lib/submit";
import { cn } from "@/lib/utils";
import type { PhotoDraft, SongDraft, VoiceDraft } from "@/lib/types";

const STEPS = [
  { id: "wish", label: "Wish", icon: PenLine },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "music", label: "Music", icon: Music2 },
] as const;

export default function GuestbookForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [sticker, setSticker] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceDraft | null>(null);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [songs, setSongs] = useState<SongDraft[]>([]);

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<PhotoDraft[]>([]);
  photosRef.current = photos;

  // free object URLs when leaving the page
  useEffect(
    () => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)),
    []
  );

  // if a song is removed, unlink it from photos
  useEffect(() => {
    setPhotos((prev) =>
      prev.some((p) => p.songLocalId && !songs.some((s) => s.localId === p.songLocalId))
        ? prev.map((p) => (p.songLocalId && !songs.some((s) => s.localId === p.songLocalId) ? { ...p, songLocalId: null } : p))
        : prev
    );
  }, [songs]);

  function go(next: number) {
    if (step === 0 && next > 0 && !name.trim()) {
      setError("Please tell us your name first 🤍");
      return;
    }
    setError(null);
    setDir(next > step ? 1 : -1);
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasContent = !!(message.trim() || voice || photos.length || songs.length);

  async function send() {
    if (!name.trim()) {
      setStep(0);
      setError("Please tell us your name first 🤍");
      return;
    }
    if (!hasContent) {
      setError("Add a wish, a voice note, a photo or a song before sending.");
      return;
    }
    setError(null);
    setSending(true);
    setProgress({ done: 0, total: 1 });
    try {
      await submitGuestbook(
        { name, relationship, message, sticker, voice, photos, songs },
        (done, total) => setProgress({ done, total })
      );
      router.push(`/thank-you?n=${encodeURIComponent(name.trim().split(" ")[0])}`);
    } catch (e) {
      setSending(false);
      setError(
        e instanceof Error
          ? `We couldn't send your note: ${e.message}. Please check your connection and try again.`
          : "We couldn't send your note. Please try again."
      );
    }
  }

  const last = step === STEPS.length - 1;
  const pct = Math.round((progress.done / Math.max(1, progress.total)) * 100);

  return (
    <div ref={topRef} className="mx-auto w-full max-w-4xl scroll-mt-4 px-5 pb-40 pt-16 sm:pt-20">
      <header className="text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-cocoa/50 hover:text-cocoa">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="gold-foil mt-3 font-script text-5xl sm:text-6xl">Leave Your Little Note</h1>
        <GoldDivider className="mt-4" />
      </header>

      {/* step tabs */}
      <nav className="mx-auto mt-8 flex max-w-lg items-center justify-between" aria-label="Steps">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-current={active ? "step" : undefined}
              className="group flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition",
                  active
                    ? "border-gold bg-gold/25 text-gold-dark shadow-glow"
                    : done
                    ? "border-gold/50 bg-white text-gold-dark"
                    : "border-champagne bg-white/60 text-cocoa/50 group-hover:border-gold/50"
                )}
              >
                <s.icon size={18} />
              </span>
              <span className={cn("text-[11px] font-semibold uppercase tracking-[0.15em]", active ? "text-cocoa" : "text-cocoa/50")}>
                {s.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="relative mt-10 min-h-[24rem]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <WishSection
                name={name}
                relationship={relationship}
                message={message}
                sticker={sticker}
                onName={setName}
                onRelationship={setRelationship}
                onMessage={setMessage}
                onSticker={setSticker}
              />
            )}
            {step === 1 && <VoiceSection voice={voice} onChange={setVoice} />}
            {step === 2 && <PhotoSection photos={photos} songs={songs} onChange={setPhotos} />}
            {step === 3 && <MusicSection songs={songs} onChange={setSongs} />}
          </motion.section>
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mx-auto mt-6 max-w-xl rounded-xl border border-rose/50 bg-rose/10 px-4 py-3 text-center text-sm text-rose-deep"
        >
          {error}
        </motion.p>
      )}

      {/* sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-champagne/70 bg-ivory/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <button type="button" className="btn-ghost" disabled={step === 0 || sending} onClick={() => go(step - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <p className="hidden text-xs text-cocoa/50 sm:block">
            {[message.trim() && "wish", voice && "voice", photos.length && `${photos.length} photo${photos.length > 1 ? "s" : ""}`, songs.length && `${songs.length} song${songs.length > 1 ? "s" : ""}`]
              .filter(Boolean)
              .join(" · ") || "Nothing added yet"}
          </p>
          {last ? (
            <button type="button" className="btn-gold" disabled={sending} onClick={send}>
              <Send size={16} /> Send my note
            </button>
          ) : (
            <div className="flex gap-2">
              {hasContent && name.trim() && (
                <button type="button" className="btn-ghost hidden sm:inline-flex" disabled={sending} onClick={send}>
                  <Send size={15} /> Send now
                </button>
              )}
              <button type="button" className="btn-gold" disabled={sending} onClick={() => go(step + 1)}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* sending overlay */}
      <AnimatePresence>
        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ivory/90 px-6 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-gold" size={36} />
              <p className="mt-4 font-display text-2xl">Pinning your note to the book…</p>
              <p className="mt-1 font-serif italic text-cocoa/60">Please keep this page open</p>
              <div className="mx-auto mt-5 h-2 w-64 overflow-hidden rounded-full bg-champagne">
                <motion.div className="h-full rounded-full bg-gold" animate={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs tabular-nums text-cocoa/50">{pct}%</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
