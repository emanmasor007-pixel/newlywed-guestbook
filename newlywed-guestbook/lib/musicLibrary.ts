// Curated library. Files live in /public/music.
// The bundled files are original synthesized loops (royalty-free, no attribution needed).
// To use your own royalty-free tracks, drop MP3s into /public/music and edit this list.
export type LibraryTrack = {
  id: string;
  title: string;
  artist: string;
  mood: string;
  src: string;
};

export const MUSIC_LIBRARY: LibraryTrack[] = [
  { id: "golden-hour", title: "Golden Hour", artist: "Guestbook Originals", mood: "Warm & hopeful", src: "/music/golden-hour.wav" },
  { id: "slow-dance", title: "Slow Dance", artist: "Guestbook Originals", mood: "Tender & slow", src: "/music/slow-dance.wav" },
  { id: "morning-light", title: "Morning Light", artist: "Guestbook Originals", mood: "Bright & gentle", src: "/music/morning-light.wav" },
  { id: "evening-prayer-piano", title: "Evening Prayer", artist: "Guestbook Originals", mood: "Calm & reflective", src: "/music/evening-prayer-piano.wav" },
];

export function findLibraryTrack(id: string | null | undefined) {
  return MUSIC_LIBRARY.find((t) => t.id === id);
}
