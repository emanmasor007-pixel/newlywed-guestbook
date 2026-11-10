import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · A Little Note for the Newlyweds",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
