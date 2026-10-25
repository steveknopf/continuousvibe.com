import "server-only";
import { funnel, sizeUpsell, stickerUpsell, versionUpsell } from "@/config/offers";
import { formatOptions, getArtwork, getProduct, inStock, inStore, isListed, pairPrice, productPrice } from "@/lib/catalog";
import { shippingFor } from "@/lib/shipping";
import { stripe } from "@/lib/stripe";
import { US_STATES } from "@/lib/us-states";

export type CartLine =
  | { type: "artwork"; slug: string; format: string; version?: string; qty: number }
  | { type: "product"; slug: string; qty: number };

/** "50%" for a 0.5 Blacklight discount. */
const offPercent = () => `${Math.round(funnel.blacklightDiscount * 100)}%`;

/** What the customer is buying: the store cart, or one funnel choice (a print pair, or the original). */
export type OrderRequest =
  | { kind: "cart"; items: CartLine[] }
  | { kind: "funnel"; slug: string; format: string };

/** `ref` = "slug|format|version" for artwork lines, so offers after checkout know what was bought. */
export type QuoteLine = { name: string; unitAmount: number; qty: number; image?: string; ref?: string };
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
    ref: [slug, format, isPrint ? (version ?? "") : ""].join("|"),
  };
}

/** Prices an order from the catalog. The client's prices are never trusted. */
export function quote(order: OrderRequest): Quote {
  let lines: QuoteLine[];

  if (order?.kind === "funnel") {
    const art = getArtwork(order.slug);
    if (art?.collection !== "open") throw new OrderError("This print isn't part of the offer.");
    if (order.format === "original") {
      lines = [artworkLine(order.slug, order.format, undefined, "store")];
    } else {
      // The pair: the Daylight print at full price and the Blacklight print discounted.
      if (!funnel.sizes.includes(order.format)) throw new OrderError("That size isn't part of the offer.");
      const pair = pairPrice(order.format);
      const blacklight = artworkLine(order.slug, order.format, "Blacklight", "store");
      lines = [
        { ...artworkLine(order.slug, order.format, "Daylight", "store"), unitAmount: pair.daylight, image: art.photos?.daylight },
        { ...blacklight, name: `${blacklight.name}, ${offPercent()} off`, unitAmount: pair.blacklight, image: art.photos?.blacklight },
      ];
    }
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
  const shippingAmount = shippingFor(
    order.kind === "cart" ? order.items : [{ type: "artwork", slug: order.slug, format: order.format, qty: 1 }],
    subtotal,
  );
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

// ---------- Checkout: save the card, charge later ----------

/**
 * Creates the customer and a SetupIntent for an order. The browser confirms it with the card
 * details from Stripe's payment field, which saves the card WITHOUT charging it. The offers after
 * checkout only record choices; the card is charged once, for the final total, on the review page.
 */
export async function createSetup(order: OrderRequest, info: CustomerInfo) {
  const q = quote(order);
  const c = validCustomer(info);
  const ship = {
    name: c.name,
    address: { line1: c.line1, city: c.city, state: c.state, postal_code: c.postalCode, country: "US" },
  };
  const customer = await stripe().customers.create({ name: c.name, email: c.email, shipping: ship });
  const setup = await stripe().setupIntents.create({
    customer: customer.id,
    usage: "on_session",
    automatic_payment_methods: { enabled: true },
    metadata: { cv_order: order.kind, shipping: String(q.shipping), ...itemMetadata(q.lines) },
  });
  return setup.client_secret!;
}

/** The receipt is rebuilt from these, so the order is recorded exactly as it was priced. */
function itemMetadata(lines: (QuoteLine & { added?: boolean })[]) {
  return Object.fromEntries(
    lines.map((l, i) => [`item_${i}`, JSON.stringify([l.qty, l.unitAmount, l.name, l.ref ?? "", l.added ? 1 : 0])]),
  );
}

export type OrderLine = {
  qty: number;
  unitAmount: number;
  name: string;
  slug?: string;
  format?: string;
  version?: string;
  /** An offer accepted after checkout. */
  added: boolean;
};

function parseLines(metadata: Record<string, string>): OrderLine[] {
  return Object.keys(metadata)
    .filter((k) => k.startsWith("item_"))
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)))
    .map((k) => {
      const [qty, unitAmount, name, ref = "", added = 0] = JSON.parse(metadata[k]) as [number, number, string, string?, number?];
      const [slug, format, version] = ref.split("|");
      return { qty, unitAmount, name, slug: slug || undefined, format, version: version || undefined, added: added === 1 };
    });
}

export type Offer = "size" | "version" | "stickers";

/** An order between checkout and payment: what's in it and which offers were accepted. */
export type Order = {
  id: string;
  kind: string;
  created: number;
  email: string;
  shipping: { name: string; line1: string; city: string; state: string; postalCode: string } | null;
  shippingCost: number;
  lines: OrderLine[];
  /** The size upgrade, which offered prints were picked (positions in `versionOfferItems`), and the sticker pack. */
  accepted: { size: boolean; version: number[]; stickers: boolean };
  customer?: string;
  paymentMethod?: string;
};

// ---------- Local preview (no Stripe) ----------

/**
 * Sample orders for previewing the pages after checkout, only under `next dev`. Start at
 * /offer/size?order=preview (Heart 8x10, Daylight), ?order=preview-5x7 (Heart 5x7, Daylight: gets the
 * size offer), ?order=preview-8x8 (Decay 8x8, Daylight) or ?order=preview-pair (Heart 5x7 and 8x10,
 * both Daylight). Accepted offers are kept in the id: "-size" = size upgrade, "-v01" = offered prints
 * 0 and 1 picked, "-stickers" = sticker pack.
 */
export function isPreview(id: string | undefined) {
  return process.env.NODE_ENV === "development" && /^preview(-8x8|-pair|-5x7)?(-size)?(-v\d+)?(-stickers)?$/.test(id ?? "");
}

function previewOrder(id: string): Order {
  const line = (name: string, slug: string, format: string, unitAmount: number): OrderLine => ({
    qty: 1, unitAmount, name: `${name} — ${format} print (Daylight)`, slug, format, version: "Daylight", added: false,
  });
  const lines = id.startsWith("preview-8x8")
    ? [line("Decay", "decay", "8x8", 3000)]
    : id.startsWith("preview-pair")
      ? [line("Heart", "heart", "5x7", 1800), line("Heart", "heart", "8x10", 3000)]
      : id.startsWith("preview-5x7")
        ? [line("Heart", "heart", "5x7", 1800)]
        : [line("Heart", "heart", "8x10", 3000)];
  const picks = id.match(/-v(\d+)/)?.[1] ?? "";
  return {
    id,
    kind: "preview",
    created: 0,
    email: "you@example.com",
    shipping: { name: "Sample Customer", line1: "123 Main St", city: "Denver", state: "CO", postalCode: "80202" },
    shippingCost: 690,
    lines,
    accepted: { size: id.includes("-size"), version: [...picks].map(Number), stickers: id.endsWith("-stickers") },
  };
}

/** The preview id with an offer's choice changed. */
function previewId(id: string, accepted: Order["accepted"]) {
  const base = id.match(/^preview(-8x8|-pair|-5x7)?/)![0];
  return `${base}${accepted.size ? "-size" : ""}${accepted.version.length ? `-v${accepted.version.join("")}` : ""}${accepted.stickers ? "-stickers" : ""}`;
}

/** Positions picked for the version offer, from the stored value ("yes" = all, "no" = none, "0,2" = some). */
function parsePicks(value: string | undefined, available: number) {
  if (value === "yes") return [...Array(available).keys()];
  if (!value || value === "no") return [];
  return value.split(",").map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < available);
}

// ---------- Orders awaiting payment ----------

/** An order whose card was saved at checkout (SetupIntent id from the URL), or null. */
export async function getOrder(id: string | undefined): Promise<Order | null> {
  const order = await loadOrder(id);
  if (order && "offerVersionValue" in order) {
    const { offerVersionValue, ...rest } = order as Order & { offerVersionValue?: string };
    rest.accepted.version = parsePicks(offerVersionValue, versionOfferItems(rest).length);
    return rest;
  }
  return order;
}

async function loadOrder(id: string | undefined): Promise<Order | null> {
  if (isPreview(id)) return previewOrder(id!);
  if (!id?.startsWith("seti_")) return null;
  try {
    const si = await stripe().setupIntents.retrieve(id, { expand: ["customer"] });
    if (si.status !== "succeeded" || !si.metadata?.cv_order) return null;
    const cust = si.customer && typeof si.customer !== "string" && !si.customer.deleted ? si.customer : null;
    const a = cust?.shipping?.address;
    return {
      id: si.id,
      kind: si.metadata.cv_order,
      created: si.created,
      email: cust?.email ?? "",
      shipping: cust?.shipping
        ? { name: cust.shipping.name ?? "", line1: a?.line1 ?? "", city: a?.city ?? "", state: a?.state ?? "", postalCode: a?.postal_code ?? "" }
        : null,
      shippingCost: Number(si.metadata.shipping ?? 0),
      lines: parseLines(si.metadata),
      accepted: { size: si.metadata.offer_size === "yes", version: [], stickers: si.metadata.offer_stickers === "yes" },
      customer: cust?.id,
      paymentMethod: typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id,
      offerVersionValue: si.metadata.offer_version,
    } as Order & { offerVersionValue?: string };
  } catch {
    return null;
  }
}

/**
 * The print the size offer would upgrade: only when the order's one print is a single 5x7 (see
 * `sizeUpsell`) of a painting that also comes in 8x10. Returns its position in `order.lines`.
 */
export function sizeOfferItem(order: Order) {
  const prints = order.lines.filter((l) => l.slug && l.format && l.format !== "original");
  const l = prints.length === 1 ? prints[0] : undefined;
  const art = l?.slug ? getArtwork(l.slug) : undefined;
  if (!l || !art || l.qty !== 1 || l.format !== sizeUpsell.from || !art.printSizes.includes(sizeUpsell.to)) return null;
  return {
    index: order.lines.indexOf(l),
    from: l,
    to: { ...l, format: sizeUpsell.to, unitAmount: sizeUpsell.price, name: `${art.title} — ${sizeUpsell.to} print${l.version ? ` (${l.version})` : ""}` },
  };
}

/** The order's own lines, with the 5x7 swapped for the 8x10 when they took the size upgrade. */
function upgradedLines(order: Order): OrderLine[] {
  const upgrade = order.accepted.size ? sizeOfferItem(order) : null;
  return upgrade ? order.lines.map((l, i) => (i === upgrade.index ? upgrade.to : l)) : order.lines;
}

export type VersionOfferItem = { slug: string; format: string; version: string; name: string; price: number };

/**
 * The other lighting of each Daylight/Blacklight print in the order that the buyer didn't
 * already get, priced from `versionUpsell`. One print of each, in the size they ended up with.
 */
export function versionOfferItems(order: Order): VersionOfferItem[] {
  const lines = upgradedLines(order);
  const bought = new Set(lines.map((l) => `${l.slug}|${l.format}|${l.version}`));
  const items: VersionOfferItem[] = [];
  for (const l of lines) {
    const price = l.format ? versionUpsell[l.format] : undefined;
    const art = l.slug ? getArtwork(l.slug) : undefined;
    if (price === undefined || !art || !l.version || !art.printVersions?.includes(l.version)) continue;
    for (const other of art.printVersions.filter((v) => v !== l.version)) {
      const key = `${l.slug}|${l.format}|${other}`;
      if (bought.has(key)) continue;
      bought.add(key);
      items.push({ slug: art.slug, format: l.format!, version: other, name: `${art.title} — ${l.format} print (${other})`, price });
    }
  }
  return items;
}

export const STICKER_PACK_NAME = "Continuous Vibe exclusive sticker pack";

/** The lines each accepted add-on offer adds, keyed by offer. (The size upgrade changes a line instead.) */
export function offerLines(order: Order): Record<Exclude<Offer, "size">, (QuoteLine & { pick?: number })[]> {
  return {
    version: versionOfferItems(order).map((i, pick) => ({
      pick,
      name: i.name,
      unitAmount: i.price,
      qty: 1,
      ref: [i.slug, i.format, i.version].join("|"),
    })),
    stickers: [{ name: STICKER_PACK_NAME, unitAmount: stickerUpsell.price, qty: 1 }],
  };
}

/** `offer` and `pick` say which offer (and which offered print) an add-on came from. */
export type FinalLine = QuoteLine & { added: boolean; offer?: Offer; pick?: number };

/** Everything the buyer will pay for: the cart plus the accepted offers. */
export function finalLines(order: Order): { lines: FinalLine[]; total: number } {
  const offers = offerLines(order);
  const upgraded = order.accepted.size ? sizeOfferItem(order)?.index : undefined;
  const base: FinalLine[] = upgradedLines(order).map((l, i) => ({
    name: l.name,
    unitAmount: l.unitAmount,
    qty: l.qty,
    ref: l.slug ? [l.slug, l.format, l.version ?? ""].join("|") : "",
    ...(i === upgraded ? { added: true, offer: "size" as const } : { added: false }),
  }));
  const extras: FinalLine[] = [
    ...offers.version.filter((l) => order.accepted.version.includes(l.pick!)).map((l) => ({ ...l, added: true, offer: "version" as const })),
    ...(order.accepted.stickers ? offers.stickers.map((l) => ({ ...l, added: true, offer: "stickers" as const })) : []),
  ];
  const lines = [...base, ...extras];
  const total = lines.reduce((s, l) => s + l.unitAmount * l.qty, 0) + order.shippingCost;
  return { lines, total };
}

/**
 * Records the buyer's choice for an offer. For the version offer, `picks` lists which offered prints
 * they want (all of them when omitted). Returns the order id to continue with (it changes for previews).
 */
export async function setOffer(id: string, offer: Offer, on: boolean, picks?: number[]) {
  const order = await getOrder(id);
  if (!order) throw new OrderError("We couldn't find your order.");
  const available = versionOfferItems(order).length;
  const chosen =
    offer === "version" && on
      ? [...new Set(picks ?? [...Array(available).keys()])].filter((n) => Number.isInteger(n) && n >= 0 && n < available).sort()
      : [];
  if (offer === "version" && on && chosen.length === 0) throw new OrderError("Choose at least one print to add.");
  if (offer === "size" && on && !sizeOfferItem(order)) throw new OrderError("This order can't be upgraded.");
  const accepted = {
    size: offer === "size" ? on : order.accepted.size,
    version: offer === "version" ? chosen : order.accepted.version,
    stickers: offer === "stickers" ? on : order.accepted.stickers,
  };
  if (isPreview(id)) return previewId(id, accepted);
  if ((Date.now() / 1000 - order.created) / 60 > stickerUpsell.windowMinutes) throw new OrderError("This order has expired. Please check out again.");
  if (await paidCharge(order)) throw new OrderError("This order has already been paid.");
  const value = offer === "version" ? (chosen.length ? chosen.join(",") : "no") : on ? "yes" : "no";
  await stripe().setupIntents.update(id, { metadata: { [`offer_${offer}`]: value } });
  return id;
}

/** A charge already made for this order (paid or in progress), so it's never charged twice. */
async function paidCharge(order: Order) {
  if (!order.customer) return null;
  const { data } = await stripe().paymentIntents.list({ customer: order.customer, limit: 10 });
  return data.find((pi) => pi.metadata.setup_intent === order.id && ["succeeded", "processing"].includes(pi.status)) ?? null;
}

export type SubmitResult =
  | { status: "paid"; paymentIntent: string }
  | { status: "requires_action"; paymentIntent: string; clientSecret: string };

/** Charges the saved card once for the final total. */
export async function submitOrder(id: string, origin: string): Promise<SubmitResult> {
  if (isPreview(id)) return { status: "paid", paymentIntent: id };
  const order = await getOrder(id);
  if (!order) throw new OrderError("We couldn't find your order.");
  const already = await paidCharge(order);
  if (already) return { status: "paid", paymentIntent: already.id };
  if (!order.customer || !order.paymentMethod) throw new OrderError("We couldn't find your saved card. Please check out again.");

  const { lines, total } = finalLines(order);
  const ship = order.shipping;
  const choice = `${order.accepted.size ? "z" : ""}v${order.accepted.version.join("")}${order.accepted.stickers ? "s" : ""}`;
  const pi = await stripe().paymentIntents.create(
    {
      amount: total,
      currency: "usd",
      customer: order.customer,
      payment_method: order.paymentMethod,
      confirm: true,
      return_url: `${origin}/thank-you`,
      receipt_email: order.email || undefined,
      shipping: ship
        ? { name: ship.name, address: { line1: ship.line1, city: ship.city, state: ship.state, postal_code: ship.postalCode, country: "US" } }
        : undefined,
      description: lines.map((l) => (l.qty > 1 ? `${l.qty} × ${l.name}` : l.name)).join(", "),
      metadata: {
        cv_order: order.kind,
        setup_intent: order.id,
        shipping: String(order.shippingCost),
        ...itemMetadata(lines),
      },
    },
    // Submitting twice with the same choices returns the same charge.
    { idempotencyKey: `${order.id}:charge:${choice}` },
  );
  if (pi.status === "requires_action") return { status: "requires_action", paymentIntent: pi.id, clientSecret: pi.client_secret! };
  if (pi.status === "succeeded" || pi.status === "processing") return { status: "paid", paymentIntent: pi.id };
  throw new OrderError("Your card was declined. Please try another card.");
}

// ---------- After payment ----------

export type Receipt = {
  kind: string;
  email: string;
  shipping: Order["shipping"];
  shippingCost: number;
  lines: OrderLine[];
  total: number;
};

/** The paid order for a PaymentIntent id from the URL (or a preview id), or null. */
export async function getReceipt(paymentIntentId: string | undefined): Promise<Receipt | null> {
  if (isPreview(paymentIntentId)) {
    const order = previewOrder(paymentIntentId!);
    const { lines, total } = finalLines(order);
    return { ...order, lines: parseLines(itemMetadata(lines)), total };
  }
  if (!paymentIntentId?.startsWith("pi_")) return null;
  try {
    const pi = await stripe().paymentIntents.retrieve(paymentIntentId);
    if (!["succeeded", "processing"].includes(pi.status) || !pi.metadata.cv_order) return null;
    const a = pi.shipping?.address;
    return {
      kind: pi.metadata.cv_order,
      email: pi.receipt_email ?? "",
      shipping: pi.shipping
        ? { name: pi.shipping.name ?? "", line1: a?.line1 ?? "", city: a?.city ?? "", state: a?.state ?? "", postalCode: a?.postal_code ?? "" }
        : null,
      shippingCost: Number(pi.metadata.shipping ?? 0),
      lines: parseLines(pi.metadata),
      total: pi.amount,
    };
  } catch {
    return null;
  }
}
