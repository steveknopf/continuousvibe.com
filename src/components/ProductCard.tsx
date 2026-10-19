import Image from "next/image";
import Link from "next/link";
import type { Img } from "@/lib/catalog";

export function ProductCard({ href, image, title, note }: { href: string; image: Img; title: string; note?: string }) {
  return (
    <Link href={href} className="group block">
      <div className="aspect-square overflow-hidden bg-forest">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 33vw, 50vw"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="mt-3 text-lg leading-tight text-vibe group-hover:text-vibe-bright sm:text-xl">{title}</h3>
      {note && <p className="mt-1 text-sm text-mute">{note}</p>}
    </Link>
  );
}
