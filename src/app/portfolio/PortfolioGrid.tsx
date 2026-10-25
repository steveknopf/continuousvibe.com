"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Img } from "@/lib/catalog";

export type GridItem = { slug: string; title: string; image: Img; href: string; forSale: boolean; blurb: string };

/** One year's paintings: click a painting for its page, or "Quick look" for a bigger view in a pop-up card. */
export function PortfolioGrid({ items }: { items: GridItem[] }) {
  const [look, setLook] = useState<GridItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (look && !dialog.current?.open) dialog.current?.showModal();
  }, [look]);

  return (
    <>
      <div className="columns-2 gap-4 sm:gap-6 lg:columns-3">
        {items.map((item) => (
          <figure key={item.slug} className="group mb-4 break-inside-avoid sm:mb-6">
            <Link href={item.href}>
              <Image
                src={item.image.src}
                alt={item.image.alt}
                width={item.image.width}
                height={item.image.height}
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="w-full transition duration-300 group-hover:brightness-110"
              />
            </Link>
            <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Link href={item.href} className="font-display text-vibe hover:text-vibe-bright">
                {item.title}
              </Link>
              <span className="flex gap-3 text-sm">
                <button type="button" onClick={() => setLook(item)} className="text-mute underline hover:text-cream">
                  Quick look
                </button>
                {item.forSale && (
                  <Link href={item.href} className="text-mute underline hover:text-cream">
                    Purchase
                  </Link>
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setLook(null)}
        // A click on the dimmed backdrop lands on the dialog itself; clicks on the card land inside it.
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        aria-label={look ? `Quick look: ${look.title}` : "Quick look"}
        className="m-auto max-h-[92dvh] w-[min(64rem,92vw)] overflow-auto border-2 border-line bg-ink p-0 text-cream backdrop:bg-black/80"
      >
        {look && (
          <div className="relative grid gap-6 p-5 sm:p-8 md:grid-cols-[3fr_2fr] md:items-center">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="absolute right-3 top-3 flex size-9 items-center justify-center text-2xl leading-none text-mute hover:text-cream"
            >
              ×
            </button>
            <Image
              src={look.image.src}
              alt={look.image.alt}
              width={look.image.width}
              height={look.image.height}
              sizes="(min-width: 768px) 600px, 92vw"
              className="max-h-[70dvh] w-full object-contain"
            />
            <div>
              <h2 className="pr-8 text-3xl text-vibe">{look.title}</h2>
              {look.blurb && <p className="mt-4 leading-relaxed text-mute">{look.blurb}</p>}
              <Link
                href={look.href}
                className="mt-6 inline-block bg-vibe px-6 py-3 font-display text-lg text-white hover:bg-vibe-bright"
              >
                {look.forSale ? "Shop this painting" : "See details"}
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
