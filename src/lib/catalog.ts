import artworksData from "@/data/artworks.json";
import productsData from "@/data/products.json";
import portfolioOnlyData from "@/data/portfolio-only.json";
import siteImagesData from "@/data/site-images.json";
import { funnel, hiddenCategories, printPrices } from "@/config/offers";

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
  /** Mockup images per lighting (daylight / blacklight). */
  mockups?: Partial<Record<"daylight" | "blacklight", { room?: string; framed?: string; sizeComparison?: string }>>;
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

export type PortfolioItem = { slug: string; title: string; image: Img; href?: string };

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
  const items: PortfolioItem[] = [
    ...artworks.map((a) => ({
      slug: a.slug,
      title: a.title,
      image: a.images[0],
      href: inStore(a) ? `/store/${a.slug}` : undefined,
    })),
    ...(portfolioOnlyData as PortfolioItem[]),
  ];
  const byYear = new Map<string, PortfolioItem[]>();
  for (const item of items) {
    const years = yearsOf(item.image);
    if (!years) throw new Error(`${item.image.src} isn't in a year folder under public/assets/paintings/`);
    byYear.set(years, [...(byYear.get(years) ?? []), item]);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([years, items]) => ({ years, label: years.replace("-", "–"), items }));
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
  available: boolean;
  /** No price set yet: buyers ask instead of adding it to the cart. */
  askForPrice?: boolean;
};

/** The buying options shown on an artwork page, in store or funnel pricing. */
export function formatOptions(a: Artwork, mode: "store" | "funnel"): FormatOption[] {
  const options: FormatOption[] = a.printSizes.map((size) => {
    const regular = printPrices[size];
    const offer = mode === "funnel" ? funnel.sizes[size] : undefined;
    return {
      format: size,
      label: `${size} print`,
      price: offer ? offer.price : regular,
      compareAt: offer && offer.price < regular ? regular : undefined,
      shipping: offer?.shipping,
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
