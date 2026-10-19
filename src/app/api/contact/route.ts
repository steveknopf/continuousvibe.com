import { site } from "@/config/offers";

const FIELDS = ["firstName", "lastName", "email", "phone", "services", "startDate", "details"] as const;

/** Emails contact form submissions via Resend (https://resend.com). */
export async function POST(request: Request) {
  const form = await request.formData();
  const data = Object.fromEntries(FIELDS.map((f) => [f, form.getAll(f).map(String).join(", ").trim()]));
  if (!data.firstName || !data.lastName || !data.email || !data.details) {
    return Response.json({ error: "Please fill in the required fields." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: `The contact form isn't set up yet. Please email ${site.email} directly.` },
      { status: 503 },
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? "Continuous Vibe <onboarding@resend.dev>",
      to: process.env.CONTACT_TO_EMAIL ?? site.email,
      reply_to: data.email,
      subject: `New inquiry from ${data.firstName} ${data.lastName}`,
      text: FIELDS.map((f) => `${f}: ${data[f] || "-"}`).join("\n"),
    }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    return Response.json({ error: `Couldn't send your message. Please email ${site.email}.` }, { status: 502 });
  }
  return Response.json({ ok: true });
}
