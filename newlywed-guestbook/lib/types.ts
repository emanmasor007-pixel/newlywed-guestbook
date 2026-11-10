export type SongSource = "library" | "upload" | "link";

export type SongDraft = {
  localId: string;
  source: SongSource;
  title: string;
  artist: string;
  url?: string; // link source
  file?: File; // upload source
  libraryId?: string; // library source
};

export type PhotoDraft = {
  localId: string;
  blob: Blob;
  previewUrl: string;
  caption: string;
  songLocalId: string | null;
  originalName: string;
};

export type VoiceDraft = {
  blob: Blob;
  durationSeconds: number;
};

export type GuestbookDraft = {
  name: string;
  relationship: string;
  message: string;
  sticker: string | null;
  voice: VoiceDraft | null;
  photos: PhotoDraft[];
  songs: SongDraft[];
};

// ---- database rows (admin side) ----
export type Submission = {
  id: string;
  guest_name: string;
  relationship: string | null;
  message: string | null;
  sticker: string | null;
  notified: boolean;
  created_at: string;
};

export type PhotoRow = {
  id: string;
  submission_id: string;
  storage_path: string;
  caption: string | null;
  music_track_id: string | null;
  created_at: string;
};

export type VoiceRow = {
  id: string;
  submission_id: string;
  storage_path: string;
  duration_seconds: number | null;
  mime_type: string | null;
  created_at: string;
};

export type TrackRow = {
  id: string;
  submission_id: string;
  source: SongSource;
  title: string | null;
  artist: string | null;
  url: string | null;
  storage_path: string | null;
  library_track_id: string | null;
  created_at: string;
};
