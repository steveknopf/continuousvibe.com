"use client";

import Link from "next/link";
import { useState } from "react";
import { cart } from "@/lib/cart";
import { formatMoney, type Product } from "@/lib/catalog";
import { ImageGallery } from "@/components/ImageGallery";

export function ProductDetail({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const soldOut = product.stock === 0;
  const price = product.salePrice ?? product.price;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <ImageGallery images={product.images} />
      <div>
        <h1 className="text-4xl text-vibe sm:text-5xl">{product.title}</h1>
        <p className="mt-4 text-2xl">
          {product.salePrice !== undefined && <s className="mr-3 text-mute">{formatMoney(product.price)}</s>}
          {formatMoney(price)}
        </p>
        {product.stock !== null && product.stock > 0 && (
          <p className="mt-1 text-mute">Only {product.stock} available</p>
        )}
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            cart.add({
              type: "product",
              slug: product.slug,
              title: product.title,
              unitPrice: price,
              image: product.images[0].src,
              max: product.stock ?? undefined,
            });
            setAdded(true);
          }}
          className="mt-8 w-full bg-vibe px-6 py-4 font-display text-xl text-white hover:bg-vibe-bright disabled:opacity-50"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
        {added && (
          <p className="mt-3 text-center" role="status">
            Added! <Link href="/cart" className="text-vibe-bright underline">View cart</Link>
          </p>
        )}
        <div className="mt-10 space-y-4 leading-relaxed text-mute">
          {product.description.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
