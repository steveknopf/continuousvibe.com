import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { portfolioSections } from "@/lib/catalog";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  const sections = portfolioSections();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <h1 className="text-center text-5xl text-vibe">Portfolio</h1>
      <nav className="mt-6 flex justify-center gap-6">
        {sections.map((s) => (
          <a key={s.years} href={`#${s.years}`} className="underline-offset-4 hover:text-vibe-bright hover:underline">
            {s.label}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <section key={s.years} id={s.years} className="scroll-mt-24 pt-14">
          <h2 className="mb-6 text-4xl">{s.label}</h2>
          <div className="columns-2 gap-4 sm:gap-6 lg:columns-3">
            {s.items.map((item) => {
              const img = (
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="w-full transition duration-300 group-hover:brightness-110"
                />
              );
              return (
                <figure key={item.slug} className="group mb-4 break-inside-avoid sm:mb-6">
                  {item.href ? <Link href={item.href}>{img}</Link> : img}
                  <figcaption className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-display text-vibe">{item.title}</span>
                    {item.href && (
                      <Link href={item.href} className="text-sm text-mute underline hover:text-cream">
                        Purchase
                      </Link>
                    )}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
