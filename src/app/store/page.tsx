import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { formatMoney, formatOptions, listedProducts, storeArtworks, type Artwork, type Product } from "@/lib/catalog";

export const metadata: Metadata = { title: "Store" };

// Sections whose products are all hidden (see hiddenCategories in config/offers.ts) don't show.
const SECTIONS = [
  { id: "art", title: "Paintings & Prints" },
  { id: "stickers", title: "Stickers" },
  { id: "pins", title: "Bottle Cap Pins" },
].filter((s) => s.id === "art" || listedProducts.some((p) => p.category === s.id));

function artworkNote(a: Artwork) {
  const prices = formatOptions(a, "store").filter((o) => o.format !== "original").map((o) => o.price);
  const parts = [];
  if (prices.length) parts.push(`Prints from ${formatMoney(Math.min(...prices))}`);
  if (a.original) {
    parts.push(
      !a.original.available
        ? "Original sold"
        : a.original.price === null
          ? "Original available"
          : `Original ${formatMoney(a.original.price)}`,
    );
  }
  return parts.join(" · ");
}

function productNote(p: Product) {
  if (p.stock === 0) return "Sold out";
  const price = p.salePrice !== undefined ? `Sale ${formatMoney(p.salePrice)}` : formatMoney(p.price);
  return p.stock !== null && p.stock <= 5 ? `${price} · Only ${p.stock} left` : price;
}

export default function StorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <h1 className="text-center text-5xl text-vibe">Store</h1>
      <nav className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="underline-offset-4 hover:text-vibe-bright hover:underline">
            {s.title}
          </a>
        ))}
      </nav>

      {SECTIONS.map((s) => {
        const items =
          s.id === "art"
            ? storeArtworks.map((a) => (
                <ProductCard key={a.slug} href={`/store/${a.slug}`} image={a.images[0]} title={a.title} note={artworkNote(a)} />
              ))
            : listedProducts
                .filter((p) => p.category === s.id)
                .map((p) => (
                  <ProductCard key={p.slug} href={`/store/${p.slug}`} image={p.images[0]} title={p.title} note={productNote(p)} />
                ));
        return (
          <section key={s.id} id={s.id} className="scroll-mt-24 pt-14">
            <h2 className="mb-6 text-3xl">{s.title}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">{items}</div>
          </section>
        );
      })}
    </div>
  );
}
