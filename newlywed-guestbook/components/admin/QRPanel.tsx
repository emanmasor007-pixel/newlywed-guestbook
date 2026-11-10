"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import { GoldDivider } from "@/components/Scrap";
import { WEDDING } from "@/lib/config";

export default function QRPanel({ hijri }: { hijri: string }) {
  const [url, setUrl] = useState("");
  const [png, setPng] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrl(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
  }, []);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1600, // high-res for print
      color: { dark: "#4A3E3D", light: "#FFFFFF" },
    })
      .then(setPng)
      .catch(() => setError("Couldn't generate the QR code."));
  }, [url]);

  return (
    <div>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Guest QR code</h2>
          <p className="text-sm text-cocoa/60">
            Points to <span className="font-mono text-xs">{url || "…"}</span>. Set NEXT_PUBLIC_SITE_URL to your live domain before printing.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            className="btn-ghost"
            href={png || undefined}
            download="newlyweds-guestbook-qr.png"
            aria-disabled={!png}
          >
            <Download size={16} /> Download PNG
          </a>
          <button type="button" className="btn-gold" onClick={() => window.print()} disabled={!png}>
            <Printer size={16} /> Print card
          </button>
        </div>
      </div>

      {/* printable card (A5-ish proportion) */}
      <div className="paper mx-auto flex max-w-md flex-col items-center rounded-lg p-8 text-center shadow-paper print:max-w-none print:shadow-none">
        <p className="text-[11px] uppercase tracking-[0.35em] text-gold-dark">Scan to leave a</p>
        <h3 className="gold-foil mt-2 font-script text-5xl leading-tight print:!text-[#a8841f] print:![-webkit-text-fill-color:#a8841f]">
          Little Note
        </h3>
        <GoldDivider className="my-3" />
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt="QR code to the guestbook" className="aspect-square w-64 rounded-lg border-4 border-white bg-white shadow-sm print:w-[11cm]" />
        ) : (
          <div className="flex aspect-square w-64 items-center justify-center rounded-lg bg-white text-sm text-cocoa/40">
            {error ?? "Generating…"}
          </div>
        )}
        <p className="mt-5 font-display text-xl">
          {WEDDING.groomShort} &amp; {WEDDING.brideShort}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-cocoa/60">{WEDDING.dateLabel}</p>
        {hijri && <p className="font-serif text-sm italic text-cocoa/50">{hijri}</p>}
        <p className="mt-4 max-w-xs font-serif text-base italic text-cocoa/70">
          Share a wish, a photo, a voice note or a song.
          <br />
          Imbas untuk titipkan ucapan &amp; kenangan.
        </p>
      </div>
    </div>
  );
}
