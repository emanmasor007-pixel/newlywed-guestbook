"use client";

import { useEffect, useState } from "react";

type Petal = { id: number; left: number; size: number; delay: number; duration: number; drift: number; hue: number };
type Spark = { id: number; left: number; top: number; delay: number; size: number };

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Light-weight ambient layer: CSS-animated falling petals + twinkling gold sparkles.
 * Generated on the client after mount (avoids hydration mismatch). Honors reduced motion via CSS.
 */
export default function Petals({ count = 14 }: { count?: number }) {
  const [petals, setPetals] = useState<Petal[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const n = window.matchMedia("(max-width: 640px)").matches ? Math.ceil(count * 0.6) : count;
    setPetals(
      Array.from({ length: n }, (_, id) => ({
        id,
        left: rand(0, 100),
        size: rand(10, 20),
        delay: rand(-18, 0),
        duration: rand(14, 26),
        drift: rand(-90, 90),
        hue: Math.round(rand(0, 2)),
      }))
    );
    setSparks(
      Array.from({ length: 10 }, (_, id) => ({
        id,
        left: rand(3, 97),
        top: rand(4, 96),
        delay: rand(0, 6),
        size: rand(8, 15),
      }))
    );
  }, [count]);

  const colors = [
    "linear-gradient(135deg,#f3e6d6,#c9a99a)",
    "linear-gradient(135deg,#f8f4ef,#e4d3c4)",
    "linear-gradient(135deg,#eadccf,#d4c4b0)",
  ];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden print:hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.25,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: colors[p.hue],
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
      {sparks.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: s.size,
            animationDelay: `${s.delay}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
