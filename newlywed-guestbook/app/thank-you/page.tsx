"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, PenLine } from "lucide-react";
import { GoldDivider, PaperCard, Sticker } from "@/components/Scrap";

function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#C4A484", "#E8D5B5", "#C9A99A", "#E4D3C4", "#F3EBE3"];
  let shapes: confetti.Shape[] | undefined;
  try {
    shapes = [confetti.shapeFromText({ text: "🤍", scalar: 2 }), confetti.shapeFromText({ text: "🌸", scalar: 2 })];
  } catch {
    shapes = undefined;
  }
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors, ticks: 220 });
  const end = Date.now() + 2200;
  (function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors, shapes, scalar: 1.6 });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors, shapes, scalar: 1.6 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function ThankYou() {
  const params = useSearchParams();
  const first = (params.get("n") || "").slice(0, 40);

  useEffect(() => {
    const t = setTimeout(fireConfetti, 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
      >
        <Sticker emoji="💌" size={84} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="gold-foil mt-6 font-script text-6xl sm:text-7xl"
      >
        Thank you{first ? `, ${first}` : ""}!
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.8 }}
        className="mt-8 w-full"
      >
        <GoldDivider />
        <PaperCard rotate={-1} className="mt-8 text-left" animate={false}>
          <p className="font-serif text-xl leading-relaxed">
            Your little note has been pinned to our book. It means the world that you took a moment to share it with us.
          </p>
          <p className="mt-4 font-serif text-lg italic leading-relaxed text-cocoa/75">
            Terima kasih! Catatan kecil anda telah kami simpan dengan penuh kasih. Semoga Allah membalas kebaikan anda
            dan melimpahkan keberkatan kepada kita semua.
          </p>
          <p className="mt-5 text-right font-script text-2xl text-cocoa">
            With love, Muaz &amp; Anis (Manis) <Heart size={16} className="mb-1 inline fill-rose text-rose" />
          </p>
        </PaperCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-3"
      >
        <Link href="/guestbook" className="btn-gold">
          <PenLine size={16} /> Leave another note
        </Link>
        <Link href="/" className="btn-ghost">
          Back to the start
        </Link>
      </motion.div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYou />
    </Suspense>
  );
}
