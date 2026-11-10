import { getSupabase } from "@/lib/supabase";
import { BUCKETS } from "@/lib/config";
import { extFromMime, stripMimeParams, uid } from "@/lib/utils";
import type { GuestbookDraft } from "@/lib/types";

type Progress = (done: number, total: number) => void;

async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

/**
 * Sends one guestbook entry straight to Supabase using the anon key.
 * RLS only allows INSERT for guests, so nothing can be read back from the browser.
 * Returns the new submission id.
 */
export async function submitGuestbook(draft: GuestbookDraft, onProgress: Progress): Promise<string> {
  const sb = getSupabase();
  const submissionId = uid();

  const uploadSongs = draft.songs.filter((s) => s.source === "upload" && s.file);
  const total = 1 + draft.photos.length + (draft.voice ? 1 : 0) + uploadSongs.length + 1;
  let done = 0;
  const tick = () => onProgress(++done, total);

  // 1. Submission row first (child rows reference it)
  {
    const { error } = await sb.from("submissions").insert({
      id: submissionId,
      guest_name: draft.name.trim(),
      relationship: draft.relationship.trim() || null,
      message: draft.message.trim() || null,
      sticker: draft.sticker,
    });
    if (error) throw new Error(error.message);
    tick();
  }

  // 2. Uploads
  const photoPaths = new Map<string, string>();
  await inBatches(draft.photos, 3, async (p) => {
    const path = `${submissionId}/${p.localId}.jpg`;
    const { error } = await sb.storage.from(BUCKETS.photos).upload(path, p.blob, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    photoPaths.set(p.localId, path);
    tick();
  });

  let voicePath: string | null = null;
  if (draft.voice) {
    const type = stripMimeParams(draft.voice.blob.type || "audio/webm");
    voicePath = `${submissionId}/voice-${uid()}.${extFromMime(type)}`;
    const { error } = await sb.storage.from(BUCKETS.voice).upload(voicePath, draft.voice.blob, {
      contentType: type,
      upsert: false,
    });
    if (error) throw new Error(`Voice upload failed: ${error.message}`);
    tick();
  }

  const songPaths = new Map<string, string>();
  await inBatches(uploadSongs, 2, async (s) => {
    const file = s.file as File;
    const type = stripMimeParams(file.type || "audio/mpeg");
    const path = `${submissionId}/${s.localId}.${extFromMime(type) === "bin" ? "mp3" : extFromMime(type)}`;
    const { error } = await sb.storage.from(BUCKETS.music).upload(path, file, {
      contentType: type,
      upsert: false,
    });
    if (error) throw new Error(`Song upload failed: ${error.message}`);
    songPaths.set(s.localId, path);
    tick();
  });

  // 3. Metadata rows. Songs first, because photos can reference them.
  const songDbIds = new Map<string, string>();
  if (draft.songs.length) {
    const rows = draft.songs.map((s) => {
      const id = uid();
      songDbIds.set(s.localId, id);
      return {
        id,
        submission_id: submissionId,
        source: s.source,
        title: s.title.trim() || null,
        artist: s.artist.trim() || null,
        url: s.source === "link" ? s.url?.trim() || null : null,
        storage_path: s.source === "upload" ? songPaths.get(s.localId) ?? null : null,
        library_track_id: s.source === "library" ? s.libraryId ?? null : null,
      };
    });
    const { error } = await sb.from("music_tracks").insert(rows);
    if (error) throw new Error(error.message);
  }

  if (draft.photos.length) {
    const rows = draft.photos.map((p) => ({
      id: p.localId,
      submission_id: submissionId,
      storage_path: photoPaths.get(p.localId) as string,
      caption: p.caption.trim() || null,
      music_track_id: p.songLocalId ? songDbIds.get(p.songLocalId) ?? null : null,
    }));
    const { error } = await sb.from("photos").insert(rows);
    if (error) throw new Error(error.message);
  }

  if (draft.voice && voicePath) {
    const { error } = await sb.from("voice_messages").insert({
      id: uid(),
      submission_id: submissionId,
      storage_path: voicePath,
      duration_seconds: Math.round(draft.voice.durationSeconds),
      mime_type: stripMimeParams(draft.voice.blob.type || "audio/webm"),
    });
    if (error) throw new Error(error.message);
  }
  tick();

  // 4. Fire-and-forget email alert (never blocks or fails the guest's submission)
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: submissionId }),
    keepalive: true,
  }).catch(() => {});

  return submissionId;
}
