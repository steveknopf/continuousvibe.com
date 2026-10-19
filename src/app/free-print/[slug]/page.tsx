import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtworkDetail } from "@/components/ArtworkDetail";
import { formatOptions, getArtwork, openCollection } from "@/lib/catalog";

// Funnel step 2: the store's product page, with the free print offer pricing.

export function generateStaticParams() {
  return openCollection.map(({ slug }) => ({ slug }));
}

export const metadata: Metadata = { title: "Choose your size", robots: { index: false } };

export default async function FreePrintPage({ params }: PageProps<"/free-print/[slug]">) {
  const { slug } = await params;
  const artwork = getArtwork(slug);
  if (artwork?.collection !== "open") notFound();
  return <ArtworkDetail artwork={artwork} options={formatOptions(artwork, "funnel")} mode="funnel" />;
}
