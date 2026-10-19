import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArtworkDetail } from "@/components/ArtworkDetail";
import { ProductDetail } from "@/components/ProductDetail";
import { formatOptions, getArtwork, getProduct, inStore, isListed, listedProducts, storeArtworks } from "@/lib/catalog";

export function generateStaticParams() {
  return [...storeArtworks, ...listedProducts].map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/store/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = getArtwork(slug) ?? getProduct(slug);
  return item
    ? { title: item.title, description: item.description[0], openGraph: { images: [item.images[0].src] } }
    : {};
}

export default async function StoreItemPage({ params }: PageProps<"/store/[slug]">) {
  const { slug } = await params;
  const artwork = getArtwork(slug);
  // Portfolio-only paintings aren't for sale; old links go back to the store.
  if (artwork && !inStore(artwork)) redirect("/store");
  if (artwork) return <ArtworkDetail artwork={artwork} options={formatOptions(artwork, "store")} mode="store" />;
  const product = getProduct(slug);
  // Products taken out of the store send old links back to the store.
  if (product && !isListed(product)) redirect("/store");
  if (product) return <ProductDetail product={product} />;
  notFound();
}
