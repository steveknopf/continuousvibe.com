import { site } from "@/config/offers";
import { emailConfigured, inboxAddress, sendEmail } from "@/lib/email";

const FIELDS = ["firstName", "lastName", "email", "phone", "services", "startDate", "details"] as const;
const LABELS: Record<(typeof FIELDS)[number], string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  services: "Interested in",
  startDate: "Start date",
  details: "Message",
};

/** Emails contact form submissions to the site inbox. */
export async function POST(request: Request) {
  const form = await request.formData();
  const data = Object.fromEntries(FIELDS.map((f) => [f, form.getAll(f).map(String).join(", ").trim()]));
  if (!data.firstName || !data.lastName || !data.email || !data.details) {
    return Response.json({ error: "Please fill in the required fields." }, { status: 400 });
  }

  if (!emailConfigured()) {
    return Response.json(
      { error: `The contact form isn't set up yet. Please email ${site.email} directly.` },
      { status: 503 },
    );
  }

  try {
    await sendEmail({
      to: inboxAddress(),
      replyTo: data.email,
      subject: `New inquiry from ${data.firstName} ${data.lastName}`,
      text: FIELDS.map((f) => `${LABELS[f]}: ${data[f] || "-"}`).join("\n"),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: `Couldn't send your message. Please email ${site.email}.` }, { status: 502 });
  }
  return Response.json({ ok: true });
}
