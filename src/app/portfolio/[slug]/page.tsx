import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ImageGallery } from "@/components/ImageGallery";
import { getPortfolioItem, portfolioItems, yearLabel } from "@/lib/catalog";

// A painting that isn't for sale: its photos and story. Paintings for sale live at /store/[slug].

export function generateStaticParams() {
  return portfolioItems()
    .filter((i) => !i.forSale)
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = getPortfolioItem(slug);
  return item ? { title: item.title, description: item.description[0], openGraph: { images: [item.image.src] } } : {};
}

export default async function PortfolioItemPage({ params }: PageProps<"/portfolio/[slug]">) {
  const { slug } = await params;
  const item = getPortfolioItem(slug);
  if (!item) notFound();
  if (item.forSale) redirect(item.href);

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <ImageGallery images={item.images} />

      <div>
        <Link href={`/portfolio#${item.years}`} className="text-sm text-mute underline hover:text-cream">
          ← Back to the portfolio
        </Link>
        <h1 className="mt-4 text-4xl text-vibe sm:text-5xl">{item.title}</h1>
        <p className="mt-3 text-sm uppercase tracking-widest text-mute">{yearLabel(item.years)} · Not for sale</p>

        {item.description.length > 0 && (
          <div className="mt-8 space-y-4 leading-relaxed">
            {item.description.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        )}

        <div className="mt-10 border-2 border-line p-6">
          <p className="font-display text-xl">Love this one?</p>
          <p className="mt-2 leading-relaxed text-mute">
            This painting isn&apos;t for sale, but I paint commissions. Tell me what you have in mind.
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-block bg-vibe px-6 py-3 font-display text-lg text-white hover:bg-vibe-bright"
          >
            Commission a painting
          </Link>
        </div>
      </div>
    </div>
  );
}
