"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Download,
  ExternalLink,
  Heart,
  Loader2,
  LogOut,
  Mic,
  Music2,
  PenLine,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { ADMIN_EMAIL, BUCKETS, STICKERS, WEDDING } from "@/lib/config";
import { findLibraryTrack } from "@/lib/musicLibrary";
import { cn, formatClock, formatDateTime } from "@/lib/utils";
import { PaperCard, Polaroid, Sticker } from "@/components/Scrap";
import QRPanel from "@/components/admin/QRPanel";
import type { PhotoRow, Submission, TrackRow, VoiceRow } from "@/lib/types";

type Tab = "overview" | "wishes" | "photos" | "voice" | "music" | "qr" | "settings";

const TABS: Array<{ id: Tab; label: string; icon: typeof Heart }> = [
  { id: "overview", label: "Overview", icon: Heart },
  { id: "wishes", label: "Wish wall", icon: PenLine },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "music", label: "Music", icon: Music2 },
  { id: "qr", label: "QR code", icon: QrCode },
  { id: "settings", label: "Settings", icon: Settings },
];

type UrlMap = Record<string, string>;

export default function AdminDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");

  const [subs, setSubs] = useState<Submission[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [voices, setVoices] = useState<VoiceRow[]>([]);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<UrlMap>({});
  const [voiceUrls, setVoiceUrls] = useState<UrlMap>({});
  const [trackUrls, setTrackUrls] = useState<UrlMap>({});

  const [lightbox, setLightbox] = useState<PhotoRow | null>(null);
  const [hijri, setHijri] = useState<string>(WEDDING.hijriFallback);
  const [hijriDraft, setHijriDraft] = useState<string>(WEDDING.hijriFallback);
  const [hijriMsg, setHijriMsg] = useState<string | null>(null);

  const subMap = useMemo(() => new Map(subs.map((s) => [s.id, s])), [subs]);

  const signUrls = useCallback(async (bucket: string, paths: string[]): Promise<UrlMap> => {
    if (!paths.length) return {};
    const { data } = await getSupabase().storage.from(bucket).createSignedUrls(paths, 60 * 60);
    const map: UrlMap = {};
    data?.forEach((d) => {
      if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
    });
    return map;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sb = getSupabase();
    const [s, p, v, t, h] = await Promise.all([
      sb.from("submissions").select("*").order("created_at", { ascending: false }),
      sb.from("photos").select("*").order("created_at", { ascending: false }),
      sb.from("voice_messages").select("*").order("created_at", { ascending: false }),
      sb.from("music_tracks").select("*").order("created_at", { ascending: false }),
      sb.from("site_settings").select("value").eq("key", "hijri_date").maybeSingle(),
    ]);
    const firstErr = s.error || p.error || v.error || t.error;
    if (firstErr) {
      setError(`Couldn't load data: ${firstErr.message}`);
      setLoading(false);
      return;
    }
    const photoRows = (p.data ?? []) as PhotoRow[];
    const voiceRows = (v.data ?? []) as VoiceRow[];
    const trackRows = (t.data ?? []) as TrackRow[];
    setSubs((s.data ?? []) as Submission[]);
    setPhotos(photoRows);
    setVoices(voiceRows);
    setTracks(trackRows);
    if (h.data?.value) {
      setHijri(h.data.value);
      setHijriDraft(h.data.value);
    }
    const [pu, vu, tu] = await Promise.all([
      signUrls(BUCKETS.photos, photoRows.map((x) => x.storage_path)),
      signUrls(BUCKETS.voice, voiceRows.map((x) => x.storage_path)),
      signUrls(BUCKETS.music, trackRows.filter((x) => x.storage_path).map((x) => x.storage_path as string)),
    ]);
    setPhotoUrls(pu);
    setVoiceUrls(vu);
    setTrackUrls(tu);
    setLoading(false);
  }, [signUrls]);

  // auth gate (RLS is the real protection; this just routes people sensibly)
  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email?.toLowerCase();
      if (!email || email !== ADMIN_EMAIL) {
        router.replace("/admin/login");
        return;
      }
      setReady(true);
      load();
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/admin/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router, load]);

  async function signOut() {
    await getSupabase().auth.signOut();
    router.replace("/admin/login");
  }

  // ---------- deletion ----------
  async function removeFiles(bucket: string, paths: string[]) {
    if (paths.length) await getSupabase().storage.from(bucket).remove(paths);
  }

  async function deleteSubmission(id: string) {
    if (!confirm("Delete this guest's whole note, including all their photos, voice note and songs? This can't be undone.")) return;
    const sb = getSupabase();
    await Promise.all([
      removeFiles(BUCKETS.photos, photos.filter((x) => x.submission_id === id).map((x) => x.storage_path)),
      removeFiles(BUCKETS.voice, voices.filter((x) => x.submission_id === id).map((x) => x.storage_path)),
      removeFiles(BUCKETS.music, tracks.filter((x) => x.submission_id === id && x.storage_path).map((x) => x.storage_path as string)),
    ]);
    const { error: err } = await sb.from("submissions").delete().eq("id", id);
    if (err) return setError(err.message);
    load();
  }

  async function deletePhoto(row: PhotoRow) {
    if (!confirm("Delete this photo?")) return;
    await removeFiles(BUCKETS.photos, [row.storage_path]);
    const { error: err } = await getSupabase().from("photos").delete().eq("id", row.id);
    if (err) return setError(err.message);
    setLightbox(null);
    load();
  }

  async function deleteVoice(row: VoiceRow) {
    if (!confirm("Delete this voice message?")) return;
    await removeFiles(BUCKETS.voice, [row.storage_path]);
    const { error: err } = await getSupabase().from("voice_messages").delete().eq("id", row.id);
    if (err) return setError(err.message);
    load();
  }

  async function deleteTrack(row: TrackRow) {
    if (!confirm("Remove this song?")) return;
    if (row.storage_path) await removeFiles(BUCKETS.music, [row.storage_path]);
    const { error: err } = await getSupabase().from("music_tracks").delete().eq("id", row.id);
    if (err) return setError(err.message);
    load();
  }

  async function saveHijri() {
    setHijriMsg(null);
    const { error: err } = await getSupabase()
      .from("site_settings")
      .upsert({ key: "hijri_date", value: hijriDraft.trim(), updated_at: new Date().toISOString() });
    if (err) return setHijriMsg(`Couldn't save: ${err.message}`);
    setHijri(hijriDraft.trim());
    setHijriMsg("Saved. The landing page now shows this date.");
  }

  // ---------- search / filter ----------
  const groups = useMemo(
    () => Array.from(new Set(subs.map((s) => s.relationship?.trim()).filter(Boolean) as string[])).sort(),
    [subs]
  );
  const q = query.trim().toLowerCase();
  const subMatches = (id: string) => {
    const s = subMap.get(id);
    if (!s) return false;
    if (group && (s.relationship ?? "") !== group) return false;
    return true;
  };

  const fWishes = subs.filter((s) => {
    if (group && (s.relationship ?? "") !== group) return false;
    if (!q) return true;
    return [s.guest_name, s.message, s.relationship].some((x) => x?.toLowerCase().includes(q));
  });
  const fPhotos = photos.filter((p) => {
    if (!subMatches(p.submission_id)) return false;
    if (!q) return true;
    return [p.caption, subMap.get(p.submission_id)?.guest_name].some((x) => x?.toLowerCase().includes(q));
  });
  const fVoices = voices.filter((v) => {
    if (!subMatches(v.submission_id)) return false;
    if (!q) return true;
    return subMap.get(v.submission_id)?.guest_name.toLowerCase().includes(q);
  });
  const fTracks = tracks.filter((t) => {
    if (!subMatches(t.submission_id)) return false;
    if (!q) return true;
    return [t.title, t.artist, subMap.get(t.submission_id)?.guest_name].some((x) => x?.toLowerCase().includes(q));
  });

  if (!ready) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center">
        <Loader2 className="animate-spin text-gold" />
      </main>
    );
  }

  const showSearch = tab !== "overview" && tab !== "qr" && tab !== "settings";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <header className="no-print flex flex-wrap items-center justify-between gap-3 pr-0 pt-12 sm:pt-0 sm:pr-40">
        <div>
          <h1 className="gold-foil font-script text-4xl">Guestbook dashboard</h1>
          <p className="text-xs text-cocoa/50">{ADMIN_EMAIL}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !px-4 !py-2" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn-ghost !px-4 !py-2" onClick={signOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </header>

      <nav className="no-print -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "border-gold bg-gold/25" : "border-champagne bg-white/60 text-cocoa/70 hover:border-gold/60"
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </nav>

      {showSearch && (
        <div className="no-print mt-4 flex flex-wrap gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa/40" />
            <input className="field !pl-10" placeholder="Search names, messages, captions, songs…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="field !w-auto" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter by group">
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p role="alert" className="no-print mt-4 rounded-xl border border-rose/50 bg-rose/10 px-4 py-3 text-sm text-rose-deep">{error}</p>}

      <div className="mt-6">
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Notes", value: subs.length, icon: PenLine },
                { label: "Photos", value: photos.length, icon: Camera },
                { label: "Voice notes", value: voices.length, icon: Mic },
                { label: "Songs", value: tracks.length, icon: Music2 },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="paper rounded-2xl p-5 shadow-paper"
                >
                  <c.icon size={20} className="text-gold-dark" />
                  <p className="mt-3 font-display text-4xl tabular-nums">{c.value}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-cocoa/60">{c.label}</p>
                </motion.div>
              ))}
            </div>
            <div>
              <h2 className="font-display text-xl">Latest notes</h2>
              {subs.length === 0 ? (
                <p className="mt-3 font-serif italic text-cocoa/60">Nothing yet — the first note will appear here.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {subs.slice(0, 6).map((s) => (
                    <li key={s.id} className="flex items-start gap-3 rounded-xl border border-champagne bg-white/70 p-3">
                      <span className="text-xl">{STICKERS.find((x) => x.id === s.sticker)?.emoji ?? "💌"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {s.guest_name} <span className="font-normal text-cocoa/50">· {formatDateTime(s.created_at)}</span>
                        </p>
                        <p className="line-clamp-2 text-sm text-cocoa/75">{s.message || "(no written message)"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "wishes" && (
          <>
            {fWishes.length === 0 && <Empty text="No notes match." />}
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {fWishes.map((s, i) => {
                const emoji = STICKERS.find((x) => x.id === s.sticker)?.emoji;
                const nPhotos = photos.filter((p) => p.submission_id === s.id).length;
                const nVoice = voices.filter((v) => v.submission_id === s.id).length;
                const nSongs = tracks.filter((t) => t.submission_id === s.id).length;
                return (
                  <div key={s.id} className="mb-8 break-inside-avoid">
                    <PaperCard rotate={i % 2 ? 0.8 : -0.8} className="relative">
                      {emoji && <Sticker emoji={emoji} className="absolute -right-3 -top-4 rotate-12" size={46} />}
                      <p className="whitespace-pre-wrap break-words font-script text-2xl leading-relaxed">
                        {s.message || <span className="text-cocoa/40">(no written message)</span>}
                      </p>
                      <p className="mt-4 text-right font-serif text-lg italic">
                        — {s.guest_name}
                        {s.relationship && <span className="block text-sm not-italic text-cocoa/50">{s.relationship}</span>}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-champagne pt-3 text-xs text-cocoa/55">
                        <span>
                          {formatDateTime(s.created_at)}
                          {(nPhotos || nVoice || nSongs) > 0 && ` · ${nPhotos}📷 ${nVoice}🎙️ ${nSongs}🎵`}
                        </span>
                        <button aria-label="Delete note" onClick={() => deleteSubmission(s.id)} className="rounded-full p-1.5 transition hover:bg-rose/20 hover:text-rose-deep">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </PaperCard>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "photos" && (
          <>
            {fPhotos.length === 0 && <Empty text="No photos match." />}
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {fPhotos.map((p, i) => {
                const track = tracks.find((t) => t.id === p.music_track_id);
                return (
                  <button key={p.id} type="button" onClick={() => setLightbox(p)} className="text-left transition hover:-translate-y-1">
                    <Polaroid
                      src={photoUrls[p.storage_path]}
                      alt={p.caption ?? "Guest photo"}
                      rotate={i % 2 ? 1.5 : -1.5}
                      decoration={i % 3 === 0 ? "pin" : "tape"}
                      caption={p.caption}
                    />
                    <p className="mt-2 text-center text-xs text-cocoa/60">
                      {subMap.get(p.submission_id)?.guest_name}
                      {track && <span className="block truncate">🎵 {track.title}</span>}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "voice" && (
          <>
            {fVoices.length === 0 && <Empty text="No voice notes match." />}
            <ul className="grid gap-4 md:grid-cols-2">
              {fVoices.map((v) => (
                <li key={v.id} className="paper rounded-2xl p-4 shadow-paper">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{subMap.get(v.submission_id)?.guest_name ?? "Guest"}</p>
                      <p className="text-xs text-cocoa/55">
                        {formatDateTime(v.created_at)}
                        {v.duration_seconds != null && ` · ${formatClock(v.duration_seconds)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {voiceUrls[v.storage_path] && (
                        <a aria-label="Download" href={voiceUrls[v.storage_path]} download className="rounded-full p-2 transition hover:bg-champagne">
                          <Download size={16} />
                        </a>
                      )}
                      <button aria-label="Delete voice note" onClick={() => deleteVoice(v)} className="rounded-full p-2 transition hover:bg-rose/20 hover:text-rose-deep">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {voiceUrls[v.storage_path] ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <audio controls preload="none" src={voiceUrls[v.storage_path]} className="mt-3 w-full" />
                  ) : (
                    <p className="mt-3 text-sm text-cocoa/50">Audio unavailable.</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "music" && (
          <>
            {fTracks.length === 0 && <Empty text="No songs match." />}
            <ul className="grid gap-4 md:grid-cols-2">
              {fTracks.map((t) => {
                const lib = findLibraryTrack(t.library_track_id);
                const src = t.source === "library" ? lib?.src : t.storage_path ? trackUrls[t.storage_path] : undefined;
                const attached = photos.filter((p) => p.music_track_id === t.id).length;
                return (
                  <li key={t.id} className="paper rounded-2xl p-4 shadow-paper">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.title || "Untitled"}</p>
                        <p className="truncate text-sm text-cocoa/65">{t.artist || "Unknown artist"}</p>
                        <p className="mt-1 text-xs text-cocoa/50">
                          {subMap.get(t.submission_id)?.guest_name} · {t.source === "library" ? "Library" : t.source === "upload" ? "Uploaded" : "Link"}
                          {attached > 0 && ` · on ${attached} photo${attached > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <button aria-label="Remove song" onClick={() => deleteTrack(t)} className="rounded-full p-2 transition hover:bg-rose/20 hover:text-rose-deep">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {src && (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <audio controls preload="none" src={src} className="mt-3 w-full" />
                    )}
                    {t.source === "link" && t.url && (
                      <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-3 !py-2 text-xs">
                        <ExternalLink size={14} /> Open link
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "qr" && <QRPanel hijri={hijri} />}

        {tab === "settings" && (
          <div className="paper max-w-lg rounded-2xl p-6 shadow-paper">
            <h2 className="font-display text-xl">Hijri date</h2>
            <p className="mt-1 text-sm text-cocoa/65">
              Shown on the landing page under {WEDDING.dateLabel}. Confirm it against the official Malaysian Hijri calendar (JAKIM) before the wedding. Leave empty to hide it.
            </p>
            <input className="field mt-4" value={hijriDraft} onChange={(e) => setHijriDraft(e.target.value)} placeholder="e.g. 9 Rajab 1448 H" maxLength={60} />
            <button className="btn-gold mt-4" onClick={saveHijri}>
              <Save size={16} /> Save
            </button>
            {hijriMsg && <p className="mt-3 text-sm text-cocoa/70">{hijriMsg}</p>}
          </div>
        )}
      </div>

      {/* photo lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa/80 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrls[lightbox.storage_path]} alt={lightbox.caption ?? "Guest photo"} className="max-h-[78vh] rounded-lg bg-white object-contain p-2 shadow-2xl" />
              <div className="mt-3 flex items-center justify-between gap-3 text-ivory">
                <div className="min-w-0">
                  <p className="truncate font-script text-2xl">{lightbox.caption}</p>
                  <p className="text-xs opacity-70">From {subMap.get(lightbox.submission_id)?.guest_name}</p>
                </div>
                <div className="flex gap-2">
                  <a href={photoUrls[lightbox.storage_path]} download target="_blank" rel="noopener noreferrer" className="btn-ghost !border-white/30 !bg-white/10 !text-ivory">
                    <Download size={15} /> Download
                  </a>
                  <button onClick={() => deletePhoto(lightbox)} className="btn-ghost !border-white/30 !bg-white/10 !text-ivory">
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
              <button aria-label="Close" onClick={() => setLightbox(null)} className="absolute -right-3 -top-3 rounded-full bg-ivory p-2 text-cocoa shadow-lg">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-12 text-center font-serif text-lg italic text-cocoa/50">{text}</p>;
}
