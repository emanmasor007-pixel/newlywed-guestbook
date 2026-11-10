"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Washi tape strip. */
export function Tape({
  className,
  color = "rgba(228,211,196,.78)",
  rotate = -4,
}: {
  className?: string;
  color?: string;
  rotate?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute z-10 block h-6 w-20 shadow-sm", className)}
      style={{
        transform: `rotate(${rotate}deg)`,
        background: `repeating-linear-gradient(90deg, ${color} 0 6px, rgba(255,255,255,.35) 6px 8px)`,
        clipPath: "polygon(2% 0, 98% 4%, 100% 50%, 97% 100%, 3% 96%, 0 50%)",
      }}
    />
  );
}

/** Gold push-pin. */
export function Pin({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute z-10 block h-4 w-4 rounded-full", className)}
      style={{
        background: "radial-gradient(circle at 30% 30%, #f6efe6, #c4a484 55%, #8c6a4f)",
        boxShadow: "0 3px 5px rgba(74,62,61,.45)",
      }}
    />
  );
}

/** Paper card with texture, gentle tilt and optional tape. */
export function PaperCard({
  children,
  className,
  rotate = 0,
  tape = true,
  tapeColor,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  tape?: boolean;
  tapeColor?: string;
  animate?: boolean;
}) {
  const body = (
    <div
      className={cn("paper relative rounded-[6px] p-5 shadow-paper", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {tape && <Tape className="-top-3 left-1/2 -translate-x-1/2" color={tapeColor} rotate={rotate * -1 - 2} />}
      {children}
    </div>
  );
  if (!animate) return body;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {body}
    </motion.div>
  );
}

/** Polaroid frame. Pass `src` for a photo or children for custom art. */
export function Polaroid({
  src,
  alt = "",
  caption,
  rotate = 0,
  decoration = "tape",
  className,
  children,
  imgClassName,
  imageFrameClassName,
}: {
  src?: string;
  alt?: string;
  caption?: React.ReactNode;
  rotate?: number;
  decoration?: "tape" | "pin" | "none";
  className?: string;
  imgClassName?: string;
  imageFrameClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("relative bg-white p-2.5 pb-3 shadow-polaroid", className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {decoration === "tape" && <Tape className="-top-3 left-1/2 -translate-x-1/2" rotate={-3 + rotate * -0.5} />}
      {decoration === "pin" && <Pin className="-top-2 left-1/2 -translate-x-1/2" />}
      <div className={cn("relative w-full overflow-hidden bg-cream", imageFrameClassName ?? "aspect-square")}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className={cn("h-full w-full object-cover", imgClassName)} loading="lazy" />
        ) : (
          children
        )}
      </div>
      {caption !== undefined && caption !== null && caption !== "" && (
        <div className="mt-2 min-h-[1.5rem] px-1 text-center font-script text-lg leading-snug text-cocoa/80">{caption}</div>
      )}
    </div>
  );
}

/** Round "sticker" with a white die-cut border. */
export function Sticker({ emoji, className, size = 44 }: { emoji: string; className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex select-none items-center justify-center rounded-full bg-white shadow-paper", className)}
      style={{ width: size, height: size, fontSize: size * 0.55, outline: "3px solid #fff" }}
    >
      {emoji}
    </span>
  );
}

/** Gold foil divider with a tiny heart. */
export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold" />
      <span className="gold-foil text-lg">❦</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold" />
    </div>
  );
}
