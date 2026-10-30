import "server-only";
import { site } from "@/config/offers";
import { sendEmail } from "@/lib/email";
import { emailLayout, layoutImages, socialLinks } from "@/lib/email-layout";

// The check-in email sent a while after an order: has it arrived, and would they leave a review.
// It's handed to Resend with the receipt, scheduled for FOLLOW_UP_DAYS later.

export const FOLLOW_UP_DAYS = 16;

const SUBJECT = "Has your artwork arrived?";

const p = (html: string) => `<p style="margin:0 0 16px;">${html}</p>`;

export function followUpHtml() {
  return emailLayout({
    body: [
      `<h1 style="margin:0 0 20px;font-size:26px;color:#e61212;">Hey!</h1>`,
      p(`It's been ${FOLLOW_UP_DAYS} days since you placed an order for some of my artwork.`),
      p(`So I just want to make sure it's arrived?`),
      p(`If it hasn't arrived yet, please just reply back to this email and I'll look into it and sort it for you.`),
      p(`If it has arrived, I hope you love it just as much as I loved creating it! :)`),
      p(`I'd like to ask you a quick favor if you don't mind please.`),
      p(`It's only a small one BUT it will make a huge impact on my small creative business. Please could you leave me a review?`),
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;"><tr>
        <td style="background:#e61212;border-radius:4px;"><a href="${site.review}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-weight:bold;font-size:16px;text-decoration:none;">Leave a review</a></td>
      </tr></table>`,
      p(`I really appreciate it :)`),
      p(`Thank you again for supporting me and my artwork, it means a lot.`),
      `<p style="margin:0;">Take care,<br>Steve</p>`,
    ].join("\n      "),
    footerNote: `P.S. If you share any pics of your prints in their new home please do tag me using @continuousvibe<br>${socialLinks()}`,
  });
}

export function followUpText() {
  return [
    `Hey!`,
    ``,
    `It's been ${FOLLOW_UP_DAYS} days since you placed an order for some of my artwork.`,
    ``,
    `So I just want to make sure it's arrived?`,
    ``,
    `If it hasn't arrived yet, please just reply back to this email and I'll look into it and sort it for you.`,
    ``,
    `If it has arrived, I hope you love it just as much as I loved creating it! :)`,
    ``,
    `I'd like to ask you a quick favor if you don't mind please.`,
    ``,
    `It's only a small one BUT it will make a huge impact on my small creative business. Please could you leave me a review?`,
    site.review,
    ``,
    `I really appreciate it :)`,
    ``,
    `Thank you again for supporting me and my artwork, it means a lot.`,
    ``,
    `Take care,`,
    `Steve`,
    ``,
    `P.S. If you share any pics of your prints in their new home please do tag me using @continuousvibe`,
    `Instagram: ${site.instagram}`,
    `Facebook: ${site.facebook}`,
  ].join("\n");
}

/** Schedules the follow-up for an order. Resend drops a repeat with the same key. */
export async function scheduleFollowUp(paymentIntentId: string, to: string) {
  await sendEmail({
    to,
    subject: SUBJECT,
    text: followUpText(),
    html: followUpHtml(),
    inlineImages: layoutImages,
    sendAt: new Date(Date.now() + FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000),
    idempotencyKey: `follow-up/${paymentIntentId}`,
  });
}
