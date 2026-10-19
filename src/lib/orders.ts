import "server-only";
import type Stripe from "stripe";
import { funnel, shipping, stickerUpsell } from "@/config/offers";
import { formatOptions, getArtwork, getProduct, inStock, inStore, isListed, productPrice } from "@/lib/catalog";
import { stripe } from "@/lib/stripe";
import { US_STATES } from "@/lib/us-states";

export type CartLine =
  | { type: "artwork"; slug: string; format: string; version?: string; qty: number }
  | { type: "product"; slug: string; qty: number };

/** What the customer is buying: the store cart, or a single free-print funnel item. */
export type OrderRequest =
  | { kind: "cart"; items: CartLine[] }
  | { kind: "funnel"; slug: string; format: string; version?: string };

export type QuoteLine = { name: string; unitAmount: number; qty: number; image?: string };
export type Quote = { lines: QuoteLine[]; subtotal: number; shipping: number; total: number };

export type CustomerInfo = { name: string; email: string; line1: string; city: string; state: string; postalCode: string };

export class OrderError extends Error {}

function artworkLine(slug: string, format: string, version: string | undefined, mode: "store" | "funnel"): QuoteLine {
  const art = getArtwork(slug);
  const option = art && formatOptions(art, mode).find((o) => o.format === format);
  if (!art || !option || !inStore(art)) throw new OrderError("That artwork isn't for sale right now.");
  if (option.askForPrice) throw new OrderError(`"${art.title}" original isn't for sale online yet. Please ask for the price.`);
  if (!option.available) throw new OrderError(`"${art.title}" original has already sold.`);
  const isPrint = format !== "original";
  if (isPrint && art.printVersions && (!version || !art.printVersions.includes(version))) {
    throw new OrderError(`Choose a version for "${art.title}".`);
  }
  return {
    name: `${art.title} — ${option.label}${isPrint && version ? ` (${version})` : ""}`,
    unitAmount: option.price,
    qty: 1,
    image: art.images[0]?.src,
  };
}

/** Prices an order from the catalog. The client's prices are never trusted. */
export function quote(order: OrderRequest): Quote {
  let lines: QuoteLine[];
  let shippingAmount: number | undefined;

  if (order?.kind === "funnel") {
    if (getArtwork(order.slug)?.collection !== "open") throw new OrderError("This print isn't part of the offer.");
    lines = [artworkLine(order.slug, order.format, order.version, "funnel")];
    shippingAmount = funnel.sizes[order.format]?.shipping;
  } else if (order?.kind === "cart" && Array.isArray(order.items) && order.items.length > 0) {
    lines = order.items.map((l) => {
      const qty = Math.floor(Number(l.qty));
      if (!(qty >= 1 && qty <= 20)) throw new OrderError("Invalid quantity.");
      if (l.type === "artwork") {
        if (l.format === "original" && qty > 1) throw new OrderError("Originals are one of a kind.");
        return { ...artworkLine(l.slug, l.format, l.version, "store"), qty };
      }
      const p = getProduct(l.slug);
      if (p && !isListed(p)) throw new OrderError(`"${p.title}" isn't available right now.`);
      if (!p || !inStock(p)) throw new OrderError(`"${p?.title ?? l.slug}" is sold out.`);
      if (p.stock !== null && qty > p.stock) throw new OrderError(`Only ${p.stock} of "${p.title}" left.`);
      return { name: p.title, unitAmount: productPrice(p), qty, image: p.images[0]?.src };
    });
  } else {
    throw new OrderError("Your cart is empty.");
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitAmount * l.qty, 0);
  shippingAmount ??= subtotal >= shipping.freeOver ? 0 : shipping.flatRate;
  return { lines, subtotal, shipping: shippingAmount, total: subtotal + shippingAmount };
}

function validCustomer(c: CustomerInfo): CustomerInfo {
  const clean = Object.fromEntries(
    (["name", "email", "line1", "city", "state", "postalCode"] as const).map((k) => [k, String(c?.[k] ?? "").trim()]),
  ) as CustomerInfo;
  if (!clean.name || !clean.line1 || !clean.city) throw new OrderError("Please fill in your name and address.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean.email)) throw new OrderError("Please enter a valid email address.");
  if (!US_STATES.some(([code]) => code === clean.state)) throw new OrderError("Please select your state.");
  if (!/^\d{5}(-\d{4})?$/.test(clean.postalCode)) throw new OrderError("Please enter a valid ZIP code.");
  return clean;
}

/**
 * Creates the customer and the payment for an order. The browser then confirms it with the card
 * details entered in Stripe's payment field. The card is saved so the sticker upsell is one click.
 */
export async function createPayment(order: OrderRequest, info: CustomerInfo) {
  const q = quote(order);
  const c = validCustomer(info);
  const ship = {
    name: c.name,
    address: { line1: c.line1, city: c.city, state: c.state, postal_code: c.postalCode, country: "US" },
  };
  const customer = await stripe().customers.create({ name: c.name, email: c.email, shipping: ship });

  // The receipt is rebuilt from these, so the order is recorded exactly as it was priced.
  const items = Object.fromEntries(q.lines.map((l, i) => [`item_${i}`, JSON.stringify([l.qty, l.unitAmount, l.name])]));
  const intent = await stripe().paymentIntents.create({
    amount: q.total,
    currency: "usd",
    customer: customer.id,
    setup_future_usage: "off_session",
    automatic_payment_methods: { enabled: true },
    receipt_email: c.email,
    shipping: ship,
    description: q.lines.map((l) => (l.qty > 1 ? `${l.qty} × ${l.name}` : l.name)).join(", "),
    metadata: { cv_order: order.kind, shipping: String(q.shipping), ...items },
  });
  return intent.client_secret!;
}

// ---------- After payment ----------

/**
 * Local preview of the post-checkout pages with a sample order, no Stripe needed:
 * /offer/stickers?payment_intent=preview, /thank-you?payment_intent=preview (declined)
 * and /thank-you?payment_intent=preview-stickers (accepted). Only works under `next dev`.
 */
export function isPreview(id: string | undefined) {
  return process.env.NODE_ENV === "development" && (id === "preview" || id === "preview-stickers");
}

function previewOrder(id: string) {
  return {
    id,
    amount: 1500,
    receipt_email: "you@example.com",
    shipping: { name: "Sample Customer", address: { line1: "123 Main St", city: "Denver", state: "CO", postal_code: "80202", country: "US" } },
    metadata: { cv_order: "preview", shipping: "0", item_0: JSON.stringify([1, 1500, "Heart — 8x10 print (Daylight)"]) },
  } as unknown as Stripe.PaymentIntent;
}

/** The paid order for a PaymentIntent id from the URL, or null. */
export async function getPaidOrder(paymentIntentId: string | undefined) {
  if (isPreview(paymentIntentId)) return previewOrder(paymentIntentId!);
  if (!paymentIntentId?.startsWith("pi_")) return null;
  try {
    const pi = await stripe().paymentIntents.retrieve(paymentIntentId);
    return pi.status === "succeeded" && pi.metadata.cv_order ? pi : null;
  } catch {
    return null;
  }
}

export function orderLines(pi: Stripe.PaymentIntent) {
  return Object.keys(pi.metadata)
    .filter((k) => k.startsWith("item_"))
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)))
    .map((k) => {
      const [qty, unitAmount, name] = JSON.parse(pi.metadata[k]) as [number, number, string];
      return { qty, unitAmount, name };
    });
}

/** Upsell charges made after this order, oldest first. */
export async function upsellCharges(pi: Stripe.PaymentIntent) {
  if (isPreview(pi.id)) {
    return pi.id === "preview-stickers"
      ? [{ amount: stickerUpsell.price, description: "Continuous Vibe exclusive sticker pack" } as Stripe.PaymentIntent]
      : [];
  }
  if (typeof pi.customer !== "string") return [];
  const { data } = await stripe().paymentIntents.list({ customer: pi.customer, limit: 20 });
  return data.filter((x) => x.metadata.parent_order === pi.id && x.status === "succeeded").reverse();
}

/** Charges the card saved at checkout for the sticker pack. */
export async function acceptStickerPack(paymentIntentId: string) {
  const pi = await getPaidOrder(paymentIntentId);
  if (!pi) throw new OrderError("We couldn't find your order.");
  if ((Date.now() / 1000 - pi.created) / 60 > stickerUpsell.windowMinutes) throw new OrderError("This offer has expired.");
  const paymentMethod = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;
  if (typeof pi.customer !== "string" || !paymentMethod) throw new OrderError("We couldn't reuse your payment method.");

  await stripe().paymentIntents.create(
    {
      amount: stickerUpsell.price,
      currency: "usd",
      customer: pi.customer,
      payment_method: paymentMethod,
      off_session: true,
      confirm: true,
      description: "Continuous Vibe exclusive sticker pack",
      receipt_email: pi.receipt_email ?? undefined,
      shipping: pi.shipping
        ? {
            name: pi.shipping.name ?? "",
            address: {
              line1: pi.shipping.address?.line1 ?? undefined,
              city: pi.shipping.address?.city ?? undefined,
              state: pi.shipping.address?.state ?? undefined,
              postal_code: pi.shipping.address?.postal_code ?? undefined,
              country: pi.shipping.address?.country ?? undefined,
            },
          }
        : undefined,
      metadata: { parent_order: pi.id, offer: "stickers" },
    },
    // A double click or page refresh can never charge the sticker pack twice.
    { idempotencyKey: `${pi.id}:stickers` },
  );
}
