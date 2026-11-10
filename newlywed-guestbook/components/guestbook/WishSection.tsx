"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smile, Sparkles } from "lucide-react";
import { PaperCard, Sticker } from "@/components/Scrap";
import { EMOJIS, LIMITS, RELATIONSHIPS, STICKERS, WISH_TEMPLATES } from "@/lib/config";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  relationship: string;
  message: string;
  sticker: string | null;
  onName: (v: string) => void;
  onRelationship: (v: string) => void;
  onMessage: (v: string) => void;
  onSticker: (v: string | null) => void;
};

export default function WishSection(p: Props) {
  const [showEmoji, setShowEmoji] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = LIMITS.maxMessageChars - p.message.length;

  function insertAtCursor(text: string) {
    const el = areaRef.current;
    if (!el) return p.onMessage((p.message + text).slice(0, LIMITS.maxMessageChars));
    const start = el.selectionStart ?? p.message.length;
    const end = el.selectionEnd ?? p.message.length;
    const next = (p.message.slice(0, start) + text + p.message.slice(end)).slice(0, LIMITS.maxMessageChars);
    p.onMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = Math.min(next.length, start + text.length);
      el.setSelectionRange(pos, pos);
    });
  }

  const stickerEmoji = STICKERS.find((s) => s.id === p.sticker)?.emoji;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">
              Your name <span className="text-rose-deep">*</span>
            </label>
            <input
              id="name"
              className="field"
              value={p.name}
              maxLength={100}
              autoComplete="name"
              placeholder="e.g. Aisyah"
              onChange={(e) => p.onName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rel" className="label">
              Who are you to them? <span className="normal-case tracking-normal text-cocoa/40">(optional)</span>
            </label>
            <input
              id="rel"
              className="field"
              list="relationships"
              value={p.relationship}
              maxLength={60}
              placeholder="Friend, family, colleague…"
              onChange={(e) => p.onRelationship(e.target.value)}
            />
            <datalist id="relationships">
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-end justify-between">
            <label htmlFor="msg" className="label !mb-0">
              Your wish / Ucapan anda
            </label>
            <span className={cn("text-xs tabular-nums", remaining < 40 ? "text-rose-deep" : "text-cocoa/50")}>
              {p.message.length}/{LIMITS.maxMessageChars}
            </span>
          </div>
          <div className="relative">
            <textarea
              id="msg"
              ref={areaRef}
              rows={6}
              className="field resize-none font-serif text-lg leading-relaxed"
              value={p.message}
              maxLength={LIMITS.maxMessageChars}
              placeholder="Write something from the heart…"
              onChange={(e) => p.onMessage(e.target.value)}
            />
            <button
              type="button"
              aria-label="Add emoji"
              onClick={() => setShowEmoji((v) => !v)}
              className="absolute bottom-3 right-3 rounded-full bg-cream p-2 text-cocoa/70 transition hover:bg-champagne"
            >
              <Smile size={18} />
            </button>
          </div>
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="grid grid-cols-8 gap-1 rounded-xl border border-champagne bg-white/80 p-2 sm:grid-cols-12">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => insertAtCursor(e)}
                      className="rounded-lg p-1.5 text-xl transition hover:scale-125 hover:bg-cream"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <span className="label flex items-center gap-1.5">
            <Sparkles size={13} /> Need inspiration?
          </span>
          <div className="flex flex-wrap gap-2">
            {WISH_TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => p.onMessage(t.text)}
                className="rounded-full border border-champagne bg-white/70 px-3.5 py-1.5 text-xs font-medium text-cocoa/80 transition hover:border-gold hover:bg-white"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Add a sticker</span>
          <div className="flex flex-wrap gap-3">
            {STICKERS.map((s) => {
              const active = p.sticker === s.id;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  aria-label={s.label}
                  aria-pressed={active}
                  whileHover={{ scale: 1.15, rotate: -6 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => p.onSticker(active ? null : s.id)}
                  className={cn("rounded-full transition", active && "ring-2 ring-gold ring-offset-2 ring-offset-ivory")}
                >
                  <Sticker emoji={s.emoji} size={46} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* live preview */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <span className="label">Live preview</span>
        <PaperCard rotate={-1.5} className="min-h-[15rem]" animate={false}>
          {stickerEmoji && <Sticker emoji={stickerEmoji} className="absolute -right-3 -top-4 rotate-12" size={52} />}
          <p className="mb-3 text-center text-[11px] uppercase tracking-[0.3em] text-gold-dark">A little note</p>
          <p className="whitespace-pre-wrap break-words font-script text-2xl leading-relaxed text-cocoa">
            {p.message || <span className="text-cocoa/30">Your words will appear here…</span>}
          </p>
          <p className="mt-5 text-right font-serif text-lg italic text-cocoa/80">
            — {p.name.trim() || "Your name"}
            {p.relationship.trim() && <span className="block text-sm not-italic text-cocoa/50">{p.relationship.trim()}</span>}
          </p>
        </PaperCard>
      </div>
    </div>
  );
}
