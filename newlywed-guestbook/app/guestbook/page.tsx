import type { Metadata } from "next";
import GuestbookForm from "@/components/guestbook/GuestbookForm";

export const metadata: Metadata = { title: "Leave Your Little Note · A Little Note for the Newlyweds" };

export default function GuestbookPage() {
  return (
    <main>
      <GuestbookForm />
    </main>
  );
}
