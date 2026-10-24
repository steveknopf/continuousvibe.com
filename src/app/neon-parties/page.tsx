import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArtwork } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Neon Parties",
  description:
    "Continuous Vibe Neon Party art shows: blacklight paintings, live painting and DJs. The first was March 28, 2026 at Tres Litros Beer Company in Salida, Colorado.",
};

const A = "/assets/neon-party";

/** Add each person's Instagram link here when you have it. */
const CREDITS: { role: string; people: { name: string; instagram?: string }[] }[] = [
  { role: "Music", people: [{ name: "DJ Old Nate" }, { name: "DJ Foxy Grandpa" }, { name: "DJ Sandia" }] },
  { role: "Photos & video", people: [{ name: "Sara" }] },
  { role: "Venue", people: [{ name: "Tres Litros Beer Company, Salida" }] },
];

const PHOTOS = [
  { file: "entrance", w: 1106, h: 1600, alt: "Paintings hung by the entrance at Tres Litros Beer Company" },
  { file: "dj-booth", w: 1067, h: 1600, alt: "The DJ booth glowing under blacklight" },
  { file: "vase-wall", w: 1067, h: 1600, alt: "Vase and other paintings glowing on the brick wall" },
  { file: "djs", w: 1067, h: 1600, alt: "DJs playing beside a neon mountain mural" },
  { file: "glowing-wall", w: 1067, h: 1600, alt: "A row of paintings glowing along the windows" },
  { file: "dance-floor", w: 1152, h: 1600, alt: "The crowd in front of the DJ booth" },
  { file: "blacklight-wall", w: 1067, h: 1600, alt: "Large paintings lit by blacklight" },
  { file: "glass-blowing", w: 1067, h: 1600, alt: "A glassblower working a flame" },
  { file: "crowd", w: 1067, h: 1600, alt: "Guests in neon outfits under the paintings" },
  { file: "mandala-easel", w: 1067, h: 1600, alt: "A mandala painting on an easel" },
  { file: "painting-corner", w: 1067, h: 1600, alt: "Paintings glowing in the corner of the room" },
  { file: "sketchbook", w: 1067, h: 1600, alt: "A sketchbook and paint markers" },
];

function Photo({ file, w, h, alt, sizes }: { file: string; w: number; h: number; alt: string; sizes: string }) {
  return <Image src={`${A}/${file}.jpg`} alt={alt} width={w} height={h} sizes={sizes} className="w-full" />;
}

export default function NeonPartiesPage() {
  const hermit = getArtwork("the-horse-and-the-hermit");
  const finished = [hermit?.photos?.blacklight, hermit?.photos?.daylight]
    .map((src) => hermit?.images.find((i) => i.src === src))
    .filter((i) => i !== undefined);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h1 className="text-center text-5xl text-vibe sm:text-6xl">Neon Parties</h1>
      <p className="mt-3 text-center text-mute">Art shows lit the way the paintings were made to be seen.</p>

      {/* Recap video */}
      <section className="mx-auto mt-10 max-w-sm">
        <video
          controls
          autoPlay
          playsInline
          muted
          loop
          preload="metadata"
          poster={`${A}/recap-cover.jpg`}
          aria-label="Recap video of the first Neon Party"
          className="aspect-[9/16] w-full bg-forest object-cover"
        >
          <source src={`${A}/recap.mp4`} type="video/mp4" />
        </video>
      </section>

      {/* About the event, with the poster */}
      <section className="mx-auto mt-14 grid max-w-5xl items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-5 text-lg leading-relaxed">
          <h2 className="text-3xl text-vibe">Neon Party No. 1</h2>
          <p className="text-sm uppercase tracking-widest text-mute">March 28, 2026 · Tres Litros Beer Company · Salida, Colorado</p>
          <p>
            Traditional art shows and galleries don&apos;t let you control the light, and my paintings are made to glow.
            Most people had only ever seen my work online, and a camera never does the neon justice. So I threw my own
            show, with the blacklights on, to let people see the paintings the way they&apos;re meant to be seen.
          </p>
          <p>
            About 30 paintings lined the walls, every one of them shown for the first time: work from 2021 right up to
            the day of the show. DJ Old Nate, DJ Foxy Grandpa and DJ Sandia kept the room moving while I painted live.
            This was the first of many Neon Parties.
          </p>
        </div>
        <Image
          src={`${A}/poster.jpg`}
          alt="Continuous Vibe Neon Party art show poster: live music, live painting, March 28, 7:30 to 11, Tres Litros"
          width={1349}
          height={1800}
          sizes="(min-width: 768px) 352px, 100vw"
          className="mx-auto w-full max-w-sm"
        />
      </section>

      {/* Live painting */}
      <section className="mt-16">
        <h2 className="text-center text-3xl text-vibe">Painted live: The Horse and the Hermit</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Photo file="live-painting-hermit" w={1067} h={1600} alt="Steve painting The Horse and the Hermit live" sizes="(min-width: 1024px) 25vw, 50vw" />
          <Photo file="live-painting-hermit-2" w={1067} h={1600} alt="The Horse and the Hermit in progress under blacklight" sizes="(min-width: 1024px) 25vw, 50vw" />
          {finished.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={`${img.alt}, finished`}
              width={img.width}
              height={img.height}
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="w-full self-start"
            />
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed">
          <p>
            I painted The Horse and the Hermit live during the show and finished it that night. The hermit is the
            anglerfish skull. In the tarot, the Hermit chooses to leave society, not to shun it, but to better
            understand himself. He holds out his lantern to guide anyone willing to make the journey to the light, and
            all will be illuminated. The Hermit gives back the lessons he learned in isolation.
          </p>
          <p>
            That story has a special meaning to me. I spent years traveling in my bus, camping in the middle of
            nowhere, painting and going deep within myself to understand who I am. That light is what I want to give to
            people.
          </p>
          <p>
            The seahorse is the year of the horse, the fire horse: an active energy, an energy of doing. It&apos;s the
            energy I want to bring to sharing my light with people, and this show was an example of that.
          </p>
          {hermit && (
            <p>
              <Link href={`/store/${hermit.slug}`} className="text-vibe-bright underline">
                See The Horse and the Hermit in the store
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Photos */}
      <section className="mt-16">
        <h2 className="text-center text-3xl text-vibe">From the night</h2>
        <div className="mt-8 columns-2 gap-4 lg:columns-3">
          {PHOTOS.map((p) => (
            <figure key={p.file} className="mb-4 break-inside-avoid">
              <Photo {...p} sizes="(min-width: 1024px) 33vw, 50vw" />
            </figure>
          ))}
        </div>
      </section>

      {/* Credits */}
      <section className="mx-auto mt-14 max-w-2xl border-t border-line pt-8">
        <h2 className="text-2xl">Thank you</h2>
        <p className="mt-3 leading-relaxed text-mute">
          A big thanks to Tres Litros for hosting, and to everyone who came out and glowed with us.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-[max-content_1fr] sm:gap-x-8">
          {CREDITS.map((c) => (
            <div key={c.role} className="contents">
              <dt className="text-sm uppercase tracking-widest text-mute">{c.role}</dt>
              <dd className="mb-3 sm:mb-0">
                {c.people.map((p, i) => (
                  <span key={p.name}>
                    {i > 0 && ", "}
                    {p.instagram ? (
                      <a href={p.instagram} target="_blank" rel="noreferrer" className="text-vibe-bright underline">
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Next show */}
      <section className="mx-auto mt-16 max-w-2xl bg-forest px-6 py-10 text-center">
        <p className="text-sm uppercase tracking-widest text-mute">Neon Party No. 2</p>
        <p className="mt-2 font-display text-4xl text-sun">Coming soon · January 2027</p>
        <p className="mt-4 text-mute">Want a Neon Party at your venue or event?</p>
        <Link
          href="/contact"
          className="mt-6 inline-block bg-vibe px-8 py-4 font-display text-xl text-white hover:bg-vibe-bright"
        >
          Host a Neon Party
        </Link>
      </section>
    </div>
  );
}
