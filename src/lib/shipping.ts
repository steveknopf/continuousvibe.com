import { shipping } from "@/config/offers";
import { getArtwork } from "@/lib/catalog";

/** '16" x 20"' -> [16, 20]; '2\' 6" x 4\' 6"' -> [30, 54]; "3' x 3'" -> [36, 36]. */
export function parseInches(size: string): [number, number] | null {
  const parts = size.split(/x/i);
  if (parts.length !== 2) return null;
  const one = (s: string) => {
    const ft = s.match(/(\d+(?:\.\d+)?)\s*'/);
    const inch = s.match(/(\d+(?:\.\d+)?)\s*"/);
    return (ft ? Number(ft[1]) * 12 : 0) + (inch ? Number(inch[1]) : 0);
  };
  const [w, h] = parts.map(one);
  return w > 0 && h > 0 ? [w, h] : null;
}

/** Estimated shipping for one original painting, in cents, from its canvas size. */
export function originalShipping(size: string | null | undefined) {
  const o = shipping.originals;
  const dims = size ? parseInches(size) : null;
  const [w, h] = dims ?? [16, 20];
  const boxL = Math.max(w, h) + o.boxPadding;
  const boxW = Math.min(w, h) + o.boxPadding;
  const dimWeight = (boxL * boxW * o.boxDepth) / o.dimDivisor;
  const realWeight = w * h * o.poundsPerSqIn + o.packingPounds;
  const billable = Math.ceil(Math.max(dimWeight, realWeight));
  const oversize = boxL + 2 * (boxW + o.boxDepth) > o.oversizeLengthGirth ? o.oversizeFee : 0;
  // Round up to a whole dollar.
  return Math.ceil((o.baseFee + o.perPound * billable + oversize) / 100) * 100;
}

export type ShippingLine = { type: "artwork" | "product"; slug: string; format?: string; qty: number };

/**
 * Shipping for an order: prints and stickers ship together for one flat rate, each original is
 * priced by its size, and orders at or over the free-shipping threshold ship free.
 */
export function shippingFor(lines: ShippingLine[], subtotal: number) {
  if (subtotal >= shipping.freeOver) return 0;
  let total = 0;
  let hasSmallItems = false;
  for (const l of lines) {
    if (l.type === "artwork" && l.format === "original") {
      total += originalShipping(getArtwork(l.slug)?.original?.size) * l.qty;
    } else {
      hasSmallItems = true;
    }
  }
  return total + (hasSmallItems ? shipping.printsFlatRate : 0);
}
