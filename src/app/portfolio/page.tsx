import type { Metadata } from "next";
import { portfolioSections, shortDescription } from "@/lib/catalog";
import { PortfolioGrid } from "./PortfolioGrid";

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
          <PortfolioGrid
            items={s.items.map(({ slug, title, image, href, forSale, description }) => ({
              slug,
              title,
              image,
              href,
              forSale,
              blurb: shortDescription(description),
            }))}
          />
        </section>
      ))}
    </div>
  );
}
