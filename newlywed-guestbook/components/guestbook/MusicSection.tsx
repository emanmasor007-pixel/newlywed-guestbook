"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Link2, Music2, Pause, Play, Plus, Trash2, Upload } from "lucide-react";
import { useMusic } from "@/components/MusicProvider";
import { ALLOWED_LINK_HOSTS, LIMITS } from "@/lib/config";
import { MUSIC_LIBRARY } from "@/lib/musicLibrary";
import { cn, formatBytes, isAllowedMusicLink, uid } from "@/lib/utils";
import type { SongDraft } from "@/lib/types";

type Props = {
  songs: SongDraft[];
  onChange: (next: SongDraft[] | ((prev: SongDraft[]) => SongDraft[])) => void;
};

type Tab = "library" | "upload" | "link";

const TABS: Array<{ id: Tab; label: string; icon: typeof Music2 }> = [
  { id: "library", label: "Pick a song", icon: Music2 },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "link", label: "Paste a link", icon: Link2 },
];

export default function MusicSection({ songs, onChange }: Props) {
  const { duck } = useMusic();
  const [tab, setTab] = useState<Tab>("library");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  // upload form
  const [upTitle, setUpTitle] = useState("");
  const [upArtist, setUpArtist] = useState("");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [upError, setUpError] = useState<string | null>(null);
  // link form
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkArtist, setLinkArtist] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const full = songs.length >= LIMITS.maxSongs;

  function stopPreview() {
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current = null;
      setPreviewId(null);
      duck(false);
    }
  }
  useEffect(() => stopPreview, []); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePreview(id: string, src: string) {
    if (previewId === id) return stopPreview();
    const wasPlaying = !!previewRef.current;
    if (previewRef.current) previewRef.current.pause();
    const a = new Audio(src);
    a.loop = true;
    a.volume = 0.8;
    previewRef.current = a;
    a.play().catch(() => stopPreview());
    setPreviewId(id);
    if (!wasPlaying) duck(true);
  }

  function addLibrary(id: string) {
    const t = MUSIC_LIBRARY.find((x) => x.id === id);
    if (!t || full || songs.some((s) => s.libraryId === id)) return;
    onChange((prev) => [...prev, { localId: uid(), source: "library", title: t.title, artist: t.artist, libraryId: t.id }]);
  }

  function addUpload() {
    setUpError(null);
    if (!upFile) return setUpError("Please choose an audio file first.");
    if (!/\.(mp3|wav|m4a)$/i.test(upFile.name) && !upFile.type.startsWith("audio/"))
      return setUpError("Please choose an MP3, WAV or M4A file.");
    if (upFile.size > LIMITS.maxAudioUploadBytes)
      return setUpError(`That file is ${formatBytes(upFile.size)}. The limit is ${formatBytes(LIMITS.maxAudioUploadBytes)}.`);
    onChange((prev) => [
      ...prev,
      {
        localId: uid(),
        source: "upload",
        title: upTitle.trim() || upFile.name.replace(/\.[^.]+$/, ""),
        artist: upArtist.trim(),
        file: upFile,
      },
    ]);
    setUpFile(null);
    setUpTitle("");
    setUpArtist("");
  }

  function addLink() {
    setLinkError(null);
    if (!isAllowedMusicLink(linkUrl, ALLOWED_LINK_HOSTS))
      return setLinkError("Please paste a Spotify, TikTok or YouTube link.");
    if (!linkTitle.trim()) return setLinkError("Please add the song title.");
    onChange((prev) => [
      ...prev,
      { localId: uid(), source: "link", title: linkTitle.trim(), artist: linkArtist.trim(), url: linkUrl.trim() },
    ]);
    setLinkUrl("");
    setLinkTitle("");
    setLinkArtist("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h3 className="font-display text-2xl">The soundtrack of our memories</h3>
        <p className="mt-2 font-serif text-lg italic text-cocoa/70">
          Add a song that reminds you of them &mdash; up to {LIMITS.maxSongs}. You can attach songs to photos on the Photos step.
        </p>
      </div>

      <div className="mt-6 flex justify-center gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "border-gold bg-gold/20 text-cocoa" : "border-champagne bg-white/60 text-cocoa/70 hover:border-gold/60"
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="paper mt-5 rounded-2xl p-5 shadow-paper">
        {tab === "library" && (
          <ul className="space-y-2">
            {MUSIC_LIBRARY.map((t) => {
              const added = songs.some((s) => s.libraryId === t.id);
              const playing = previewId === t.id;
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
                  <button
                    type="button"
                    aria-label={playing ? `Pause ${t.title}` : `Preview ${t.title}`}
                    onClick={() => togglePreview(t.id, t.src)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/25 text-gold-dark transition hover:bg-gold/40"
                  >
                    {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="truncate text-xs text-cocoa/60">
                      {t.artist} &middot; {t.mood}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={added || full}
                    onClick={() => addLibrary(t.id)}
                    className="btn-ghost !px-3.5 !py-2 text-xs"
                  >
                    {added ? <Check size={14} /> : <Plus size={14} />} {added ? "Added" : "Add"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "upload" && (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-champagne bg-white/60 p-5 text-center text-sm hover:border-gold">
              <Upload size={20} className="text-gold-dark" />
              <span className="font-medium">{upFile ? upFile.name : "Choose an MP3, WAV or M4A"}</span>
              <span className="text-xs text-cocoa/50">
                {upFile ? formatBytes(upFile.size) : `Up to ${formatBytes(LIMITS.maxAudioUploadBytes)}`}
              </span>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a"
                className="hidden"
                onChange={(e) => setUpFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" placeholder="Song title" maxLength={150} value={upTitle} onChange={(e) => setUpTitle(e.target.value)} />
              <input className="field" placeholder="Artist" maxLength={150} value={upArtist} onChange={(e) => setUpArtist(e.target.value)} />
            </div>
            {upError && <p className="text-sm text-rose-deep">{upError}</p>}
            <button type="button" className="btn-gold w-full" disabled={full} onClick={addUpload}>
              <Plus size={16} /> Add this song
            </button>
          </div>
        )}

        {tab === "link" && (
          <div className="space-y-3">
            <input
              className="field"
              inputMode="url"
              placeholder="https://open.spotify.com/track/…  ·  TikTok  ·  YouTube"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field" placeholder="Song title *" maxLength={150} value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
              <input className="field" placeholder="Artist" maxLength={150} value={linkArtist} onChange={(e) => setLinkArtist(e.target.value)} />
            </div>
            {linkError && <p className="text-sm text-rose-deep">{linkError}</p>}
            <button type="button" className="btn-gold w-full" disabled={full} onClick={addLink}>
              <Plus size={16} /> Add this song
            </button>
          </div>
        )}
      </div>

      {full && <p className="mt-3 text-center text-sm text-rose-deep">You&rsquo;ve added the maximum of {LIMITS.maxSongs} songs.</p>}

      <div className="mt-6">
        <p className="label text-center">Your songs ({songs.length})</p>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {songs.map((s) => (
              <motion.li
                key={s.localId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 rounded-xl border border-champagne bg-white/70 p-3"
              >
                <Music2 size={18} className="shrink-0 text-gold-dark" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="truncate text-xs text-cocoa/60">
                    {s.artist || "Unknown artist"} &middot;{" "}
                    {s.source === "library" ? "From the library" : s.source === "upload" ? "Uploaded file" : "Link"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${s.title}`}
                  onClick={() => onChange((prev) => prev.filter((x) => x.localId !== s.localId))}
                  className="rounded-full p-2 text-cocoa/50 transition hover:bg-rose/20 hover:text-rose-deep"
                >
                  <Trash2 size={16} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
