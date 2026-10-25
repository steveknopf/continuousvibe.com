import type { Metadata } from "next";
import Image from "next/image";
import { siteImage } from "@/lib/catalog";

export const metadata: Metadata = { title: "Bio" };

export default function BioPage() {
  const bus = siteImage("bio-bus", "Steve working in his converted school bus");
  const dancing = siteImage("bio-dancing", "Steve dancing at a festival");
  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-20 px-4 py-14 sm:px-8">
        <section className="grid items-center gap-10 md:grid-cols-2">
          <Image src={bus.src} alt={bus.alt} width={bus.width} height={bus.height} sizes="(min-width: 768px) 50vw, 100vw" />
          <div>
            <h1 className="text-4xl">Bio</h1>
            <p className="mt-5 leading-relaxed">
              I didn’t take any art classes in high school. I started spray painting after high school. After I
              graduated I went to welding school and became a welder. When in welding school I told my friends I would
              be tiny by 25, I would be in a tiny home or bus or van but I would be living minimally on the road. For
              the next 6 years I worked full time as a welder and pursued art as a hobby, posting my work to{" "}
              <a href="https://www.instagram.com/mcflydesigns/" target="_blank" rel="noreferrer" className="underline">
                @mcflydesigns
              </a>{" "}
              on Instagram. In April 2019 I bought a bus to pursue my dream of living on the road making art. Buying the
              bus made quitting my job as a welder a reality. I knew that if I wanted to support myself with my art I
              would have to practice consistently and get my skills to a level that I would be confident in showing the
              world. It took me two and a half years of working as a welder during the week and working on the bus and
              painting on the weekends. I hit the road in November 2021 shortly after my 25th birthday. Now I travel the
              USA creating art along the way.
            </p>
          </div>
        </section>
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div className="md:order-2">
            <Image src={dancing.src} alt={dancing.alt} width={dancing.width} height={dancing.height} sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
          <div>
            <h2 className="text-4xl">Mission Statement</h2>
            <p className="mt-5 text-xl leading-relaxed">
              Art is a scaffolding for the viewer to project their personal human experience onto. So as an artist my
              goal is to create art that reflects the human experience. I believe the human experience is a universal
              experience. We all experience the same emotions to a different degree and handle them differently based on
              our experiences in life. I believe that all forms of religion and mythology are trying to answer the same
              questions about the human experience: where did we come from, why are we here and what happens when we
              die. Mythology is ripe with symbolism of the human experience. I believe if I combine pre-existing
              symbolism with my human experience I can create relatable art.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
