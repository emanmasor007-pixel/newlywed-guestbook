"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, Music2, X } from "lucide-react";
import { Polaroid } from "@/components/Scrap";
import { LIMITS } from "@/lib/config";
import { compressImage } from "@/lib/compress";
import { cn, formatBytes, uid } from "@/lib/utils";
import type { PhotoDraft, SongDraft } from "@/lib/types";

type Props = {
  photos: PhotoDraft[];
  songs: SongDraft[];
  onChange: (next: PhotoDraft[] | ((prev: PhotoDraft[]) => PhotoDraft[])) => void;
};

export default function PhotoSection({ photos, songs, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
      if (!files.length) {
        setNotice("Please choose image files (JPG, PNG, HEIC…).");
        return;
      }
      const room = LIMITS.maxPhotos - photos.length;
      if (room <= 0) {
        setNotice(`You can add up to ${LIMITS.maxPhotos} photos.`);
        return;
      }
      const accepted = files.slice(0, room);
      setNotice(
        files.length > room ? `Only ${room} more photo${room === 1 ? "" : "s"} fit — the rest were skipped.` : null
      );
      setBusy(true);
      const drafts: PhotoDraft[] = [];
      for (const f of accepted) {
        const blob = await compressImage(f);
        drafts.push({
          localId: uid(),
          blob,
          previewUrl: URL.createObjectURL(blob),
          caption: "",
          songLocalId: null,
          originalName: f.name,
        });
      }
      onChange((prev) => [...prev, ...drafts].slice(0, LIMITS.maxPhotos));
      setBusy(false);
    },
    [photos.length, onChange]
  );

  function remove(id: string) {
    const target = photos.find((p) => p.localId === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange((prev) => prev.filter((p) => p.localId !== id));
  }

  function patch(id: string, change: Partial<PhotoDraft>) {
    onChange((prev) => prev.map((p) => (p.localId === id ? { ...p, ...change } : p)));
  }

  const full = photos.length >= LIMITS.maxPhotos;

  return (
    <div>
      <div className="text-center">
        <h3 className="font-display text-2xl">Pin your memories</h3>
        <p className="mt-2 font-serif text-lg italic text-cocoa/70">
          Add up to {LIMITS.maxPhotos} photos &mdash; add a caption to each one if you like.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-6 rounded-2xl border-2 border-dashed p-8 text-center transition",
          dragging ? "border-gold bg-gold/10" : "border-champagne bg-white/50",
          full && "opacity-60"
        )}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="btn-gold" disabled={full || busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            {busy ? "Preparing…" : "Choose photos"}
          </button>
          <button type="button" className="btn-ghost" disabled={full || busy} onClick={() => camRef.current?.click()}>
            <Camera size={18} /> Take a photo
          </button>
        </div>
        <p className="mt-3 text-xs text-cocoa/50">
          or drag &amp; drop here &middot; {photos.length}/{LIMITS.maxPhotos} added &middot; photos are resized automatically
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {notice && <p className="mt-3 text-center text-sm text-rose-deep">{notice}</p>}

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence initial={false}>
          {photos.map((p, i) => (
            <motion.div
              key={p.localId}
              layout
              initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 1.6 : -1.6 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative"
            >
              <Polaroid src={p.previewUrl} alt={p.originalName} decoration={i % 3 === 0 ? "pin" : "tape"} />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => remove(p.localId)}
                className="absolute -right-2 -top-2 z-20 rounded-full bg-cocoa p-1.5 text-white shadow-lg transition hover:bg-rose-deep"
              >
                <X size={14} />
              </button>
              <input
                className="field mt-3 !py-2 text-sm"
                placeholder="Caption (optional)"
                maxLength={LIMITS.maxCaptionChars}
                value={p.caption}
                onChange={(e) => patch(p.localId, { caption: e.target.value })}
              />
              {songs.length > 0 && (
                <label className="mt-2 flex items-center gap-1.5 text-xs text-cocoa/60">
                  <Music2 size={13} className="shrink-0 text-gold-dark" />
                  <select
                    className="w-full rounded-lg border border-champagne bg-white/80 px-2 py-1.5 text-xs"
                    value={p.songLocalId ?? ""}
                    onChange={(e) => patch(p.localId, { songLocalId: e.target.value || null })}
                  >
                    <option value="">No song</option>
                    {songs.map((s) => (
                      <option key={s.localId} value={s.localId}>
                        {s.title || "Untitled"}
                        {s.artist ? ` — ${s.artist}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p className="mt-1 text-center text-[10px] text-cocoa/40">{formatBytes(p.blob.size)}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
