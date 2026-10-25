import type { Metadata } from "next";
import Image from "next/image";
import { getArtwork, type Img } from "@/lib/catalog";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

/** Steve at work: beside the form on wide screens, under it on phones. */
const PHOTOS: Img[] = [
  { src: "/assets/contact/live-painting-bus.jpg", alt: "Steve live painting under blacklight", width: 810, height: 540 },
  {
    src: "/assets/contact/live-painting-hermit.jpg",
    alt: "Steve painting The Horse and the Hermit at a Neon Party",
    width: 1067,
    height: 1600,
  },
  { src: "/assets/contact/steve-live-painting.jpg", alt: "Steve live painting at night", width: 717, height: 757 },
  { src: "/assets/contact/steve-hammock.jpg", alt: "Steve relaxing in a hammock", width: 287, height: 359 },
];

function blacklightImage(slug: string): Img {
  const art = getArtwork(slug)!;
  // The painting's own blacklight photo (never a mockup).
  const src = art.photos?.blacklight ?? art.photos?.daylight;
  return art.images.find((i) => i.src === src) ?? art.images[0];
}

/** A square tile beside the form: a painting (in blacklight) or a photo of Steve. */
function Tile({ img, alt, className = "" }: { img: Img; alt: string; className?: string }) {
  return (
    <Image
      src={img.src}
      alt={alt}
      width={img.width}
      height={img.height}
      sizes="16rem"
      className={`aspect-square w-full max-w-64 object-cover ${className}`}
    />
  );
}

/**
 * Centers a 16rem tile on the side chain (17.11dvh wide, so its middle is 8.555dvh from the screen edge).
 * The shift is measured from where the side column starts (2rem page padding, then the centered 80rem
 * column) and never puts the tile closer than 0.5rem to the screen edge.
 */
const OVER_LEFT_CHAIN = "relative left-[calc(max(8.555dvh_-_8rem,0.5rem)_-_2rem_-_max(0px,(100vw_-_84rem)/2))]";
const OVER_RIGHT_CHAIN = "relative right-[calc(max(8.555dvh_-_8rem,0.5rem)_-_2rem_-_max(0px,(100vw_-_84rem)/2))]";

/**
 * Wide screens: the form sits between two columns of tiles that alternate painting and photo, offset
 * left to right like a checkerboard. Phones: the photos go in a grid under the form.
 */
export default function ContactPage() {
  const painting = (slug: string) => ({ img: blacklightImage(slug), alt: "" });
  const photo = (i: number) => ({ img: PHOTOS[i], alt: PHOTOS[i].alt });
  // The paintings move out over the chains; the photos stay beside the form.
  const left = [painting("decay"), photo(0), painting("threshold-guardian"), photo(2)].map((t, i) => ({
    ...t,
    className: i % 2 === 0 ? OVER_LEFT_CHAIN : "",
  }));
  const right = [photo(1), painting("portal"), photo(3), painting("cosmic-child")].map((t, i) => ({
    ...t,
    className: i % 2 === 1 ? OVER_RIGHT_CHAIN : "",
  }));
  const side = "hidden flex-col justify-between gap-6 lg:flex";

  return (
    <div className="px-4 py-14 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)]">
        <div className={`${side} items-end`}>
          {left.map((t) => (
            <Tile key={t.img.src} {...t} />
          ))}
        </div>
        <div>
          <h1 className="text-center text-5xl leading-tight text-vibe sm:text-6xl">Let’s Work Together</h1>
          <div className="mt-12">
            <ContactForm />
          </div>
          <div className="mt-14 grid grid-cols-2 gap-4 lg:hidden">
            {PHOTOS.map((p) => (
              <Image
                key={p.src}
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                sizes="(min-width: 672px) 328px, 50vw"
                className="aspect-square w-full object-cover"
              />
            ))}
          </div>
        </div>
        <div className={`${side} items-start`}>
          {right.map((t) => (
            <Tile key={t.img.src} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}
