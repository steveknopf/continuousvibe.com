import "server-only";
import { site } from "@/config/offers";
import { formatMoney } from "@/lib/catalog";
import { emailConfigured, inboxAddress, sendEmail } from "@/lib/email";
import { emailLayout, escape, layoutImages, MUTE, socialLinks } from "@/lib/email-layout";
import { scheduleFollowUp } from "@/lib/follow-up-email";
import { getReceipt, markReceiptSent, type Receipt } from "@/lib/orders";

// The order receipt emailed to the buyer after payment, with a copy to the site inbox. The follow-up
// email is scheduled at the same time.

const money = (cents: number) => (cents === 0 ? "$0.00" : formatMoney(cents));

function rows(order: Receipt) {
  return order.lines.map((l) => ({
    name: l.name,
    detail: [l.qty > 1 ? `Qty ${l.qty}` : "", l.added ? "Add-on" : ""].filter(Boolean).join(" · "),
    amount: l.unitAmount * l.qty,
  }));
}

function address(order: Receipt) {
  const s = order.shipping;
  return s ? [s.name, s.line1, `${s.city}, ${s.state} ${s.postalCode}`].filter((x) => x.trim()) : [];
}

export function receiptText(order: Receipt) {
  return [
    `Thank you for your order!`,
    ``,
    `I'll start working on getting your order out to you right away. Please allow up to 14 business days for it to arrive.`,
    ``,
    ...rows(order).map((r) => `${r.name}${r.detail ? ` (${r.detail})` : ""}: ${money(r.amount)}`),
    `Shipping: ${order.shippingCost === 0 ? "Free" : money(order.shippingCost)}`,
    `Total: ${money(order.total)}`,
    ...(order.shipping ? [``, `Shipping to:`, ...address(order)] : []),
    ``,
    `Questions about your order? Just reply to this email.`,
    ``,
    `${site.artist}`,
    `${site.name}`,
    `Instagram: ${site.instagram}`,
    `Facebook: ${site.facebook}`,
  ].join("\n");
}

export function receiptHtml(order: Receipt) {
  const cell = "padding:14px 0;border-bottom:1px solid #e3e0d6;";
  const lineRows = rows(order)
    .map(
      (r) => `<tr>
        <td class="cv-line" style="${cell}padding-right:16px;"><strong>${escape(r.name)}</strong>${
          r.detail ? `<br><span class="cv-mute" style="font-size:13px;color:${MUTE};">${escape(r.detail)}</span>` : ""
        }</td>
        <td class="cv-line" style="${cell}text-align:right;white-space:nowrap;"><strong>${money(r.amount)}</strong></td>
      </tr>`,
    )
    .join("");
  const ship = address(order);

  return emailLayout({
    body: `<h1 style="margin:0;font-size:26px;color:#e61212;">Thank you for your order!</h1>
      <p style="margin:16px 0 0;">I'll start working on getting your order out to you right away. Please allow up to 14 business days for it to arrive.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;margin-top:16px;">
        ${lineRows}
        <tr>
          <td class="cv-mute cv-line" style="${cell}color:${MUTE};">Shipping</td>
          <td class="cv-mute cv-line" style="${cell}text-align:right;color:${MUTE};">${order.shippingCost === 0 ? "Free" : money(order.shippingCost)}</td>
        </tr>
        <tr>
          <td style="padding-top:14px;text-align:right;"><strong>Total:</strong></td>
          <td style="padding-top:14px;text-align:right;font-size:19px;"><strong>${money(order.total)}</strong></td>
        </tr>
      </table>${
        ship.length
          ? `
      <p class="cv-mute" style="margin:24px 0 0;font-size:13px;color:${MUTE};text-transform:uppercase;letter-spacing:1px;">Shipping to</p>
      <p style="margin:4px 0 0;">${ship.map(escape).join("<br>")}</p>`
          : ""
      }
      <p style="margin:28px 0 0;">Questions about your order? Just reply to this email.</p>`,
    footerNote: `Follow along for new paintings and live events<br>${socialLinks()}`,
  });
}

/**
 * Emails the receipt for a payment, once. Safe to call more than once: the payment is marked when it's
 * sent, and Resend drops a repeat with the same key, so two calls racing still send one email.
 */
export async function sendReceipt(paymentIntentId: string) {
  if (!emailConfigured() || !paymentIntentId.startsWith("pi_")) return;
  const order = await getReceipt(paymentIntentId);
  if (!order?.email || order.receiptSent) return;
  try {
    await sendEmail({
      to: order.email,
      bcc: inboxAddress(),
      subject: `Your ${site.name} order`,
      text: receiptText(order),
      html: receiptHtml(order),
      inlineImages: layoutImages,
      idempotencyKey: `receipt/${order.id}`,
    });
    await markReceiptSent(order.id);
  } catch (err) {
    console.error("Couldn't send the receipt for", paymentIntentId, err);
    return;
  }
  try {
    await scheduleFollowUp(order.id, order.email);
  } catch (err) {
    console.error("Couldn't schedule the follow-up for", paymentIntentId, err);
  }
}
