"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useMusic } from "@/components/MusicProvider";

const BAR_DELAYS = [0, 0.25, 0.1, 0.35];

export default function MusicToggle() {
  const { playing, toggle } = useMusic();

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Mute background music" : "Play background music"}
      aria-pressed={playing}
      initial={{ opacity: 0, scale: 0.6, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-gold/40 bg-ivory/85 px-3.5 py-2.5 text-cocoa shadow-glow backdrop-blur-md print:hidden"
    >
      {playing ? <Volume2 size={18} className="text-gold-dark" /> : <VolumeX size={18} className="text-cocoa/60" />}
      <span className="flex h-4 items-end gap-[3px]" aria-hidden>
        {BAR_DELAYS.map((d, i) => (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-gold"
            animate={playing ? { height: ["25%", "100%", "40%", "85%", "25%"] } : { height: "25%" }}
            transition={playing ? { duration: 1.1, repeat: Infinity, delay: d, ease: "easeInOut" } : { duration: 0.3 }}
          />
        ))}
      </span>
    </motion.button>
  );
}
