import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/**
 * Sends ONE email alert to the admin for a freshly inserted submission.
 * - Uses the service-role key (server only) because guests cannot read rows.
 * - `notified` is claimed atomically, so repeated calls with the same id never send a second email.
 */
export async function POST(req: Request) {
  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || "emanmasor007@gmail.com";
  if (!url || !serviceKey || !resendKey) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  // claim: only the first caller gets a row back
  const { data: claimed, error: claimErr } = await sb
    .from("submissions")
    .update({ notified: true })
    .eq("id", id)
    .eq("notified", false)
    .select("id, guest_name, relationship, message, sticker, created_at")
    .maybeSingle();

  if (claimErr) return NextResponse.json({ ok: false, error: "Lookup failed" }, { status: 500 });
  if (!claimed) return NextResponse.json({ ok: true, skipped: true });

  const [photos, voices, tracks] = await Promise.all([
    sb.from("photos").select("id", { count: "exact", head: true }).eq("submission_id", id),
    sb.from("voice_messages").select("id", { count: "exact", head: true }).eq("submission_id", id),
    sb.from("music_tracks").select("id", { count: "exact", head: true }).eq("submission_id", id),
  ]);

  const nPhotos = photos.count ?? 0;
  const nVoice = voices.count ?? 0;
  const nSongs = tracks.count ?? 0;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const dashboard = siteUrl ? `${siteUrl}/admin/dashboard` : "";
  const preview = claimed.message ? esc(claimed.message.slice(0, 400)) : "<em>(no written message)</em>";

  const html = `
  <div style="font-family:Georgia,serif;background:#FDFBF7;padding:24px;color:#4A3E3D">
    <div style="max-width:520px;margin:auto;background:#F7F3E9;border:1px solid #E8DCC4;border-radius:8px;padding:24px">
      <p style="letter-spacing:.25em;font-size:11px;text-transform:uppercase;color:#A8841F;margin:0">A Little Note for the Newlyweds</p>
      <h2 style="margin:8px 0 4px;font-weight:600">New note from ${esc(claimed.guest_name)} ${claimed.sticker ? "" : ""}</h2>
      ${claimed.relationship ? `<p style="margin:0;color:#4A3E3D99">${esc(claimed.relationship)}</p>` : ""}
      <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #D4AF37;background:#fff;font-size:17px;line-height:1.5">${preview}</blockquote>
      <p style="font-size:14px;margin:0">Attached: <strong>${nPhotos}</strong> photo${nPhotos === 1 ? "" : "s"} &middot;
        <strong>${nVoice}</strong> voice note${nVoice === 1 ? "" : "s"} &middot;
        <strong>${nSongs}</strong> song${nSongs === 1 ? "" : "s"}</p>
      ${dashboard ? `<p style="margin:20px 0 0"><a href="${esc(dashboard)}" style="background:#D4AF37;color:#4A3E3D;padding:10px 18px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:600">Open the dashboard</a></p>` : ""}
    </div>
  </div>`;

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Guestbook <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `New note from ${claimed.guest_name} 💌`,
      html,
    });
    if (error) throw new Error(error.message);
  } catch {
    // release the claim so a later retry can send it
    await sb.from("submissions").update({ notified: false }).eq("id", id);
    return NextResponse.json({ ok: false, error: "Email failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
