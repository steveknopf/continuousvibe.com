// Every price, offer and shipping rule on the site lives here (amounts in cents).
// Change a number here and the store, funnel pages and Stripe checkout all follow.

export const site = {
  name: "Continuous Vibe",
  artist: "Steve Knopf",
  email: "humantypeinc@gmail.com",
  instagram: "https://www.instagram.com/continuousvibe/",
  youtube: "https://www.youtube.com/channel/UCsri5wVL9HWnKMkLW4KM2fA",
  facebook: "https://www.facebook.com/p/Continuous-vibe-61563599577929/",
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
  "8x8": 2000,
};

export const shipping = {
  countries: ["US"] as const,
  /** Flat rate for store (cart) orders. */
  flatRate: 690,
  /** Store orders at or above this subtotal ship free. */
  freeOver: 10000,
};

/** The "free print" funnel: homepage -> size selection -> checkout -> sticker upsell -> thank you. */
export const funnel = {
  /** Size selection prices shown on /free-print/[slug]. */
  sizes: {
    "5x7": { price: 0, shipping: 690 },
    "8x10": { price: 1500, shipping: 0 },
  } as Record<string, { price: number; shipping: number }>,
};

/** One-click sticker pack offer shown after every checkout (store and funnel). */
export const stickerUpsell = {
  price: 700,
  /** The offer can only be accepted this long after the order is paid. */
  windowMinutes: 120,
};

/** Product mockup shown for each Open collection piece on the homepage. */
export const funnelMockups: Record<string, string> = {
  heart: "heartmockup1",
  vision: "vissionmockup1",
  "cosmic-child": "brainchieldmockup1",
  portal: "portalmockup1",
  duality: "dualitymockup1",
};
