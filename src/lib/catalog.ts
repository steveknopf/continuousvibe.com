import artworksData from "@/data/artworks.json";
import productsData from "@/data/products.json";
import portfolioOnlyData from "@/data/portfolio-only.json";
import siteImagesData from "@/data/site-images.json";
import { funnel, hiddenCategories, printPrices, shipping } from "@/config/offers";

export type Img = { src: string; alt: string; width: number; height: number };

export type Artwork = {
  slug: string;
  title: string;
  collection?: "open";
  /** false = shown in the portfolio only, not for sale in the store. */
  inStore?: boolean;
  description: string[];
  bullets: string[];
  images: Img[];
  printSizes: string[];
  /** Lighting the print was photographed in, when the buyer can choose. */
  printVersions?: string[];
  /** The full painting photo in each lighting it was photographed in. */
  photos?: Partial<Record<"daylight" | "blacklight", string>>;
  /** Mockup images per lighting (daylight / blacklight). */
  mockups?: Partial<Record<"daylight" | "blacklight", { room?: string; framed?: string; sizeComparison?: string }>>;
  /** Open collection: the Daylight and Blacklight prints framed side by side, for the funnel. */
  pairMockup?: Img;
  /** price null = not priced yet: shown as "Ask for price" and can't be bought online. */
  original?: { price: number | null; size: string | null; available: boolean };
};

export type Product = {
  slug: string;
  title: string;
  category: "stickers" | "pins";
  price: number;
  salePrice?: number;
  /** null = unlimited */
  stock: number | null;
  description: string[];
  images: Img[];
};

export type PortfolioItem = {
  slug: string;
  title: string;
  image: Img;
  /** Every photo of the painting, main photo first. */
  images: Img[];
  description: string[];
  /** For sale paintings link to the store; the rest have a page at /portfolio/[slug]. */
  forSale: boolean;
  href: string;
};

/** Paintings in portfolio-only.json: never for sale, so only title and photos (description optional). */
type PortfolioOnly = { slug: string; title: string; image: Img; images?: Img[]; description?: string[] };

/** "5x7" | "8x10" | "8x8" for prints, or "original". */
export type Format = string;

/** Year folder a painting's main photo sits in (public/assets/paintings/<years>/), e.g. "2025-26". */
function yearsOf(image: Img) {
  return image.src.match(/^\/assets\/paintings\/([^/]+)\//)?.[1] ?? "";
}

/** Newest year folder first; within a year, the order in artworks.json. */
export const artworks = (artworksData as Artwork[])
  .slice()
  .sort((a, b) => yearsOf(b.images[0]).localeCompare(yearsOf(a.images[0])));
export const products = productsData as Product[];
export const siteImages = siteImagesData as Record<string, Omit<Img, "alt">>;

/**
 * Every painting, grouped by the year folder its photo sits in
 * (public/assets/paintings/<years>/), newest first.
 */
export function portfolioSections() {
  const byYear = new Map<string, PortfolioItem[]>();
  for (const item of portfolioItems()) {
    const years = yearsOf(item.image);
    if (!years) throw new Error(`${item.image.src} isn't in a year folder under public/assets/paintings/`);
    byYear.set(years, [...(byYear.get(years) ?? []), item]);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([years, items]) => ({ years, label: yearLabel(years), items }));
}

/** "2021-22" -> "2021–22" */
export const yearLabel = (years: string) => years.replace("-", "–");

/** Every painting in the portfolio, for sale or not. */
export function portfolioItems(): PortfolioItem[] {
  return [
    ...artworks.map((a) => {
      const forSale = inStore(a);
      return {
        slug: a.slug,
        title: a.title,
        image: a.images[0],
        images: a.images,
        description: a.description,
        forSale,
        href: forSale ? `/store/${a.slug}` : `/portfolio/${a.slug}`,
      };
    }),
    ...(portfolioOnlyData as PortfolioOnly[]).map((p) => ({
      slug: p.slug,
      title: p.title,
      image: p.image,
      images: p.images ?? [p.image],
      description: p.description ?? [],
      forSale: false,
      href: `/portfolio/${p.slug}`,
    })),
  ];
}

/** A painting that isn't for sale, for its /portfolio/[slug] page. */
export function getPortfolioItem(slug: string) {
  const item = portfolioItems().find((i) => i.slug === slug);
  return item && { ...item, years: yearsOf(item.image) };
}

/** The opening of a description, cut at a word boundary, for the quick look card. */
export function shortDescription(description: string[], maxChars = 220) {
  const text = description[0] ?? "";
  if (text.length <= maxChars) return text;
  return text.slice(0, text.lastIndexOf(" ", maxChars)).replace(/[,.;:\s]+$/, "") + "…";
}

/**
 * In the store: not marked portfolio-only, and has something to buy (a print or the original).
 * The portfolio shows every painting either way.
 */
export function inStore(a: Artwork) {
  return a.inStore !== false && (a.printSizes.length > 0 || a.original !== undefined);
}

export const storeArtworks = artworks.filter(inStore);

export const openCollection = artworks.filter((a) => a.collection === "open");

export function getArtwork(slug: string) {
  return artworks.find((a) => a.slug === slug);
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function siteImage(name: string, alt = ""): Img {
  const img = siteImages[name];
  if (!img) throw new Error(`Unknown site image: ${name}`);
  return { ...img, alt };
}

export function productPrice(p: Product) {
  return p.salePrice ?? p.price;
}

/** False for products in a category taken out of the store (see hiddenCategories). */
export function isListed(p: Product) {
  return !hiddenCategories.includes(p.category);
}

/** Products currently in the store. */
export const listedProducts = products.filter(isListed);

export function inStock(p: Product) {
  return p.stock === null || p.stock > 0;
}

export type FormatOption = {
  format: Format;
  label: string;
  price: number;
  /** Regular price, shown struck through when the offer price is lower. */
  compareAt?: number;
  /** Funnel only: shipping charged for this choice. */
  shipping?: number;
  /** Funnel only: the Daylight + Blacklight split behind `price`. */
  pair?: PairPrice;
  available: boolean;
  /** No price set yet: buyers ask instead of adding it to the cart. */
  askForPrice?: boolean;
};

export type PairPrice = { daylight: number; blacklight: number };

/** Funnel pricing for one print size: the Daylight print at full price, the Blacklight one discounted. */
export function pairPrice(size: string): PairPrice {
  const regular = printPrices[size];
  return { daylight: regular, blacklight: Math.round(regular * (1 - funnel.blacklightDiscount)) };
}

/**
 * The buying options shown on an artwork page. In the store, one option per print size;
 * in the funnel, each offered size is a Daylight + Blacklight pair.
 */
export function formatOptions(a: Artwork, mode: "store" | "funnel"): FormatOption[] {
  const sizes = mode === "funnel" ? a.printSizes.filter((s) => funnel.sizes.includes(s)) : a.printSizes;
  const options: FormatOption[] = sizes.map((size) => {
    const regular = printPrices[size];
    if (mode === "store") return { format: size, label: `${size} print`, price: regular, available: true };
    const pair = pairPrice(size);
    return {
      format: size,
      label: `${size} Daylight + Blacklight prints`,
      price: pair.daylight + pair.blacklight,
      compareAt: regular * 2,
      shipping: shipping.printsFlatRate,
      pair,
      available: true,
    };
  });
  if (a.original) {
    const askForPrice = a.original.available && a.original.price === null;
    options.push({
      format: "original",
      label: a.original.size ? `Original painting (${a.original.size})` : "Original painting",
      price: a.original.price ?? 0,
      available: a.original.available && !askForPrice,
      askForPrice,
    });
  }
  return options;
}

export function formatMoney(cents: number) {
  if (cents === 0) return "FREE";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
