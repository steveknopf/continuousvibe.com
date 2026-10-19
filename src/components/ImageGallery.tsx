"use client";

import Image from "next/image";
import { useState } from "react";
import type { Img } from "@/lib/catalog";

export function ImageGallery({ images }: { images: Img[] }) {
  const [active, setActive] = useState(0);
  const main = images[active];

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
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`size-20 overflow-hidden border-2 ${i === active ? "border-vibe-bright" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <Image src={img.src} alt="" width={160} height={160} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
