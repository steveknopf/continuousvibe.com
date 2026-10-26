import "server-only";
import { site } from "@/config/offers";
import { formatMoney } from "@/lib/catalog";
import { emailConfigured, inboxAddress, sendEmail } from "@/lib/email";
import { getReceipt, markReceiptSent, type Receipt } from "@/lib/orders";

// The order receipt emailed to the buyer after payment, with a copy to the site inbox.

const money = (cents: number) => (cents === 0 ? "$0.00" : formatMoney(cents));

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

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
  ].join("\n");
}

export function receiptHtml(order: Receipt) {
  const cell = "padding:14px 0;border-bottom:1px solid #e3e0d6;";
  const lineRows = rows(order)
    .map(
      (r) => `<tr>
        <td style="${cell}padding-right:16px;"><strong>${escape(r.name)}</strong>${
          r.detail ? `<br><span style="font-size:13px;color:#77756d;">${escape(r.detail)}</span>` : ""
        }</td>
        <td style="${cell}text-align:right;white-space:nowrap;"><strong>${money(r.amount)}</strong></td>
      </tr>`,
    )
    .join("");
  const ship = address(order);

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f3f1ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ea;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;font-family:Helvetica,Arial,sans-serif;color:#1c201c;font-size:15px;line-height:1.5;">
    <tr><td style="background:#000000;padding:20px 28px;font-size:20px;font-weight:bold;letter-spacing:2px;color:#ffffff;">
      CONTINUOUS <span style="color:#e61212;">VIBE</span>
    </td></tr>
    <tr><td style="padding:32px 28px 8px;">
      <h1 style="margin:0;font-size:26px;color:#e61212;">Thank you for your order!</h1>
      <p style="margin:16px 0 0;">I'll start working on getting your order out to you right away. Please allow up to 14 business days for it to arrive.</p>
    </td></tr>
    <tr><td style="padding:16px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
        ${lineRows}
        <tr>
          <td style="${cell}color:#77756d;">Shipping</td>
          <td style="${cell}text-align:right;color:#77756d;">${order.shippingCost === 0 ? "Free" : money(order.shippingCost)}</td>
        </tr>
        <tr>
          <td style="padding-top:14px;text-align:right;"><strong>Total:</strong></td>
          <td style="padding-top:14px;text-align:right;font-size:19px;"><strong>${money(order.total)}</strong></td>
        </tr>
      </table>
    </td></tr>
    ${
      ship.length
        ? `<tr><td style="padding:8px 28px 0;">
      <p style="margin:0;font-size:13px;color:#77756d;text-transform:uppercase;letter-spacing:1px;">Shipping to</p>
      <p style="margin:4px 0 0;">${ship.map(escape).join("<br>")}</p>
    </td></tr>`
        : ""
    }
    <tr><td style="padding:28px 28px 32px;">
      <p style="margin:0;">Questions about your order? Just reply to this email.</p>
      <p style="margin:16px 0 0;">${site.artist}<br><span style="color:#77756d;">${site.name}</span></p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
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
      idempotencyKey: `receipt/${order.id}`,
    });
    await markReceiptSent(order.id);
  } catch (err) {
    console.error("Couldn't send the receipt for", paymentIntentId, err);
  }
}
