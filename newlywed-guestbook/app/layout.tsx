import type { Metadata, Viewport } from "next";
import { Aref_Ruqaa, Cormorant_Garamond, Great_Vibes, Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { MusicProvider } from "@/components/MusicProvider";
import MusicToggle from "@/components/MusicToggle";
import Petals from "@/components/Petals";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const khat = Aref_Ruqaa({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-khat", display: "swap" });

export const metadata: Metadata = {
  title: "A Little Note for the Newlyweds",
  description: "Leave a wish, a photo, a voice note or a song for Muaz & Nik Anis Nabilah — 19 December 2026.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "A Little Note for the Newlyweds",
    description: "Leave a little note for Muaz & Nik Anis Nabilah.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF8F3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${cormorant.variable} ${jakarta.variable} ${script.variable} ${khat.variable}`}>
      <body>
        <MusicProvider>
          <Petals />
          <MusicToggle />
          <div className="relative z-[2]">{children}</div>
        </MusicProvider>
      </body>
    </html>
  );
}
