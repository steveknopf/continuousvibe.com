import type { Metadata } from "next";
import Image from "next/image";
import { getArtwork, type Img } from "@/lib/catalog";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

function blacklightImage(slug: string): Img {
  const art = getArtwork(slug)!;
  // The painting's own blacklight photo (never a mockup).
  const src = art.photos?.blacklight ?? art.photos?.daylight;
  return art.images.find((i) => i.src === src) ?? art.images[0];
}

function Accent({ slug, className }: { slug: string; className: string }) {
  const img = blacklightImage(slug);
  return (
    <Image
      src={img.src}
      alt=""
      width={img.width}
      height={img.height}
      sizes="20vw"
      className={`pointer-events-none absolute hidden w-[17vw] max-w-64 object-cover lg:block ${className}`}
    />
  );
}

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden px-4 py-14 sm:px-8">
      <Accent slug="decay" className="left-[5%] top-10 aspect-square" />
      <Accent slug="portal" className="right-0 top-24" />
      <Accent slug="threshold-guardian" className="bottom-40 left-0" />
      <Accent slug="cosmic-child" className="bottom-10 right-[6%] aspect-[3/4]" />
      <div className="relative mx-auto max-w-2xl">
        <h1 className="text-center text-5xl leading-tight text-vibe sm:text-6xl">Let’s Work Together</h1>
        <div className="mt-12">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
