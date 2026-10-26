import "server-only";
import { site } from "@/config/offers";

/** The address the site sends from, e.g. "Continuous Vibe <steve@continuousvibe.com>". */
export const fromAddress = () => process.env.EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`;

/** Where contact messages and order copies go. */
export const inboxAddress = () => process.env.CONTACT_TO_EMAIL ?? site.email;

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

type Email = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  bcc?: string;
  /** Resend drops a second send with the same key (within 24 hours). */
  idempotencyKey?: string;
};

/** Sends an email through Resend (https://resend.com). Throws when it can't. */
export async function sendEmail(email: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY isn't set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: email.to,
      bcc: email.bcc,
      reply_to: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}
