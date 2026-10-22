"use client";

import Image from "next/image";
import { useState } from "react";
import type { Img } from "@/lib/catalog";

/**
 * Main image plus thumbnails. `selectedSrc` lets the page drive which image shows
 * (e.g. the size comparison when a print is chosen); clicking a thumbnail overrides it
 * until `selectedSrc` changes again.
 */
export function ImageGallery({ images, selectedSrc }: { images: Img[]; selectedSrc?: string }) {
  const [picked, setPicked] = useState<{ src: string; for?: string } | null>(null);
  const activeSrc = picked && picked.for === selectedSrc ? picked.src : (selectedSrc ?? images[0].src);
  const main = images.find((i) => i.src === activeSrc) ?? images[0];

  return (
    <div>
      <Image
        src={main.src}
        alt={main.alt}
        width={main.width}
        height={main.height}
        sizes="(min-width: 1024px) 50vw, 100vw"
        preload
        className="mx-auto max-h-[75vh] w-auto object-contain"
      />
      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setPicked({ src: img.src, for: selectedSrc })}
              aria-label={`Show image ${i + 1}: ${img.alt}`}
              aria-current={img.src === main.src}
              className={`size-20 overflow-hidden border-2 ${img.src === main.src ? "border-vibe-bright" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <Image src={img.src} alt="" width={160} height={160} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
