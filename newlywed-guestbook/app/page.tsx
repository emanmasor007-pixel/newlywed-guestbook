"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, PenLine } from "lucide-react";
import { GoldDivider, Polaroid } from "@/components/Scrap";
import { WEDDING } from "@/lib/config";
import { useHijriDate } from "@/hooks/useHijriDate";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
});

export default function LandingPage() {
  const hijri = useHijriDate();

  return (
    <main className="relative mx-auto flex min-h-[100dvh] max-w-3xl flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="paper relative w-full max-w-xl rounded-[2px] px-5 py-10 text-center shadow-paper sm:px-12 sm:py-14"
      >
        <span aria-hidden className="pointer-events-none absolute inset-3 border border-champagne/80 sm:inset-4" />

        <motion.p {...fade(0.1)} className="font-serif text-base italic tracking-wide text-cocoa/70 sm:text-lg">
          Assalamualaikum w.b.t. &amp; welcome
        </motion.p>

        <motion.div {...fade(0.25)} className="relative mx-auto mt-7 w-full max-w-[15rem] sm:max-w-[17rem]">
          <Polaroid
            src="/couple/bouquet.jpg"
            alt="Anis holding a white bouquet in sage"
            caption="A day to remember"
            decoration="tape"
            imageFrameClassName="aspect-[2/3]"
            imgClassName="object-[center_50%]"
          />
          <div className="absolute -bottom-8 -right-3 w-[6.5rem] sm:-right-8 sm:w-32">
            <Polaroid
              src="/couple/hands.jpg"
              alt="Muaz and Anis, hands with henna and rings"
              decoration="pin"
              rotate={6}
              imgClassName="object-center"
            />
          </div>
        </motion.div>

        <motion.div {...fade(0.45)} className="mt-14 sm:mt-16">
          <h1 className="font-display text-[2.65rem] leading-none tracking-tight text-cocoa sm:text-6xl">
            Muaz <span className="gold-foil px-1 font-script text-5xl sm:text-6xl">&amp;</span> Anis
            <span className="mt-1 block font-script text-[2.4rem] leading-tight text-gold-dark sm:text-5xl">(Manis)</span>
          </h1>
          <div className="mt-6">
            <GoldDivider />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.32em] text-cocoa/65">{WEDDING.dateLabel}</p>
          {hijri && <p className="mt-1 font-serif text-lg italic text-cocoa/60">{hijri}</p>}
        </motion.div>

        <motion.blockquote {...fade(0.65)} className="mx-auto mt-8 max-w-md">
          <p className="font-serif text-xl italic leading-relaxed text-cocoa/90 sm:text-[1.35rem]">
            &ldquo;{WEDDING.quote}&rdquo;
          </p>
        </motion.blockquote>

        <motion.div {...fade(0.8)} className="mx-auto mt-8 max-w-md border-y border-champagne/90 py-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold-dark">Doa pengantin</p>
          <p
            lang="ar"
            dir="rtl"
            className="mt-3 text-balance font-khat text-[1.45rem] font-bold leading-[2] text-cocoa sm:text-[1.85rem]"
          >
            {WEDDING.dua}
          </p>
        </motion.div>

        <motion.p {...fade(0.95)} className="mx-auto mt-7 max-w-md font-serif text-base italic leading-relaxed text-cocoa/70">
          Terima kasih kerana meraikan hari bahagia kami. Titipkan ucapan, gambar, rakaman suara atau lagu kenangan.
        </motion.p>

        <motion.div {...fade(1.05)} className="relative mt-8">
          <span className="absolute inset-0 -z-10 animate-ping2 rounded-full bg-champagne/80" aria-hidden />
          <Link href="/guestbook" className="btn-gold px-8 py-4 text-base">
            <PenLine size={18} /> Leave Your Little Note
          </Link>
        </motion.div>
      </motion.article>

      <motion.p
        {...fade(1.2)}
        className="mt-8 flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-cocoa/50"
      >
        Made with <Heart size={12} className="fill-rose text-rose" /> for {WEDDING.coupleDisplay} ({WEDDING.coupleNickname})
      </motion.p>
    </main>
  );
}
