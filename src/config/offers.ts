// Every price, offer and shipping rule on the site lives here (amounts in cents).
// Change a number here and the store, funnel pages and Stripe checkout all follow.

export const site = {
  name: "Continuous Vibe",
  artist: "Steve Knopf",
  email: "steve@continuousvibe.com",
  instagram: "https://www.instagram.com/continuousvibe/",
  youtube: "https://www.youtube.com/channel/UCsri5wVL9HWnKMkLW4KM2fA",
  facebook: "https://www.facebook.com/profile.php?id=61563599577929",
  /** Google review page, linked from the follow-up email. */
  review: "https://g.page/r/CavKcRuy-EKKEAE/review",
};

/**
 * Product categories taken out of the store for now. Their data and photos stay in
 * src/data/products.json; remove a category from this list to put it back on sale.
 */
export const hiddenCategories: string[] = ["pins"];

/** Regular store price of a print, by size. */
export const printPrices: Record<string, number> = {
  "5x7": 1800,
  "8x10": 3000,
  "8x8": 3000,
};

export const shipping = {
  countries: ["US"] as const,
  /** Prints and stickers: one flat rate per order. */
  printsFlatRate: 690,
  /** Orders at or above this subtotal ship free. */
  freeOver: 100000,
  /**
   * Originals are priced one by one from the canvas size, like a carrier quote (estimates; tune to
   * your real carrier rates). Billable weight = the larger of the estimated real weight and the
   * box's dimensional weight; cost = baseFee + perPound x billable weight (+ oversizeFee for big boxes).
   */
  originals: {
    /** Inches of padding added around the canvas on each side of the box (total, both sides). */
    boxPadding: 4,
    /** Box depth in inches (canvas plus padding). */
    boxDepth: 4,
    /** Carrier dimensional-weight divisor (UPS/FedEx use 139). */
    dimDivisor: 139,
    /** Estimated canvas weight in pounds per square inch, plus the packing materials. */
    poundsPerSqIn: 0.004,
    packingPounds: 2,
    baseFee: 1500,
    perPound: 85,
    /** Boxes whose length + girth exceeds this (inches) pay the large-package fee. */
    oversizeLengthGirth: 130,
    oversizeFee: 4000,
  },
};

/**
 * The homepage funnel: buy the Daylight print, get the same print in Blacklight at a discount.
 * Homepage -> /print-pair/[slug] -> checkout -> sticker upsell -> review -> thank you.
 * Prices come from printPrices; prints ship at the normal flat rate.
 */
export const funnel = {
  /** Print sizes offered as a Daylight + Blacklight pair. */
  sizes: ["5x7", "8x10"],
  /** Share taken off the Blacklight print's regular price (0.5 = half off). */
  blacklightDiscount: 0.5,
};

/**
 * First offer after checkout, when the only print in the order is a single 5x7: swap it for the 8x10
 * of the same print at this price (the 8x10 replaces the 5x7). The version offer then follows the size
 * they end up with.
 */
export const sizeUpsell = { from: "5x7", to: "8x10", price: 2500 };

/**
 * One-click offer after checkout: the other lighting (Daylight/Blacklight) of a print they bought,
 * at this price per print size. Sizes not listed get no offer.
 */
export const versionUpsell: Record<string, number> = {
  "8x10": 2000,
  "5x7": 1000,
  "8x8": 2000,
};

/** One-click sticker pack offer shown after every checkout (store and funnel). */
export const stickerUpsell = {
  price: 700,
  /** The offer can only be accepted this long after the order is paid. */
  windowMinutes: 120,
};
