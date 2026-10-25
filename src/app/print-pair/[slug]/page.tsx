import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtworkDetail } from "@/components/ArtworkDetail";
import { formatOptions, getArtwork, openCollection } from "@/lib/catalog";

// Funnel step 2: the store's product page, selling the Daylight + Blacklight print pair.

export function generateStaticParams() {
  return openCollection.map(({ slug }) => ({ slug }));
}

export const metadata: Metadata = { title: "Choose your size", robots: { index: false } };

export default async function PrintPairPage({ params }: PageProps<"/print-pair/[slug]">) {
  const { slug } = await params;
  const artwork = getArtwork(slug);
  if (artwork?.collection !== "open") notFound();
  return <ArtworkDetail artwork={artwork} options={formatOptions(artwork, "funnel")} mode="funnel" />;
}
