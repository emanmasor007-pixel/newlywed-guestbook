export const WEDDING = {
  siteTitle: "A Little Note for the Newlyweds",
  groomFull: "Muhammad Muaz Al-Iman bin Mansor",
  brideFull: "Nik Anis Nabilah binti Nik Ahmad Rosmani",
  groomShort: "Muhammad Muaz Al-Iman",
  brideShort: "Nik Anis Nabilah",
  coupleDisplay: "Muaz & Anis",
  coupleNickname: "Manis",
  quote: "Once in a while, right in the middle of an ordinary life, love gives us a fairytale",
  dua: "اللَّهُمَّ بَارِكْ لَهُمَا وَبَارِكْ عَلَيْهِمَا وَاجْمَعْ بَيْنَهُمَا فِي خَيْرٍ",
  dateLabel: "19 December 2026",
  isoDate: "2026-12-19",
  // Fallback only. The live value is read from the `site_settings` table
  // and can be edited in Admin > Settings.
  hijriFallback: process.env.NEXT_PUBLIC_HIJRI_DATE || "10 Rejab 1448 H",
} as const;

export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "emanmasor007@gmail.com"
).toLowerCase();

export const LIMITS = {
  maxPhotos: 20,
  maxVoiceSeconds: 90,
  maxMessageChars: 500,
  maxCaptionChars: 140,
  maxSongs: 5,
  maxAudioUploadBytes: 15 * 1024 * 1024,
} as const;

export const BUCKETS = {
  photos: "guest-photos",
  voice: "guest-voice",
  music: "guest-music",
} as const;

export const RELATIONSHIPS = [
  "Family / Keluarga",
  "Friend / Rakan",
  "Colleague / Rakan sekerja",
  "Student / Pelajar",
  "Neighbour / Jiran",
  "Other / Lain-lain",
];

export const WISH_TEMPLATES = [
  {
    label: "Barakallah",
    text: "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fi khair. May your home be filled with sakinah, mawaddah and rahmah. 🤍",
  },
  {
    label: "Selamat Pengantin Baru",
    text: "Selamat pengantin baru! Semoga bahagia hingga ke Jannah, rumahtangga dilimpahi rahmat dan kasih sayang. 🌸",
  },
  {
    label: "Warm wishes",
    text: "Wishing you a lifetime of love, laughter and little joys. So happy to celebrate with you both today! ✨",
  },
  {
    label: "Doa untuk kalian",
    text: "Semoga Allah satukan hati kalian dalam kasih yang tulus, sabar dalam ujian dan syukur dalam nikmat. Aamiin. 🌙",
  },
];

export const STICKERS = [
  { id: "blossom", emoji: "🌸", label: "Blossom" },
  { id: "rings", emoji: "💍", label: "Rings" },
  { id: "dove", emoji: "🕊️", label: "Dove" },
  { id: "moon", emoji: "🌙", label: "Moon" },
  { id: "sparkle", emoji: "✨", label: "Sparkle" },
  { id: "letter", emoji: "💌", label: "Love letter" },
  { id: "heart", emoji: "🤍", label: "Heart" },
  { id: "book", emoji: "📖", label: "Book" },
  { id: "bouquet", emoji: "💐", label: "Bouquet" },
  { id: "cake", emoji: "🍰", label: "Cake" },
];

export const EMOJIS = [
  "🤍", "💕", "💖", "💐", "🌸", "🌷", "🌹", "✨", "🌙", "⭐", "🕊️", "💍",
  "🥰", "😊", "😭", "🥹", "🙏", "🤲", "🎉", "🥳", "🍰", "📖", "🏡", "👨‍👩‍👧‍👦",
];

export const ALLOWED_LINK_HOSTS = [
  "spotify.com",
  "open.spotify.com",
  "spotify.link",
  "tiktok.com",
  "vm.tiktok.com",
  "youtube.com",
  "music.youtube.com",
  "youtu.be",
];
