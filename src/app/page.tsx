import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@/components/Icons";
import { funnel, funnelMockups, printPrices, site } from "@/config/offers";
import { formatMoney, openCollection, siteImage, type Img } from "@/lib/catalog";

// Funnel step 1: the free print landing page (formerly on systeme.io).

const smallPrint = funnel.sizes["5x7"];

function Pic({
  img,
  className = "",
  sizes = "(min-width: 768px) 33vw, 100vw",
  style,
}: {
  img: Img;
  className?: string;
  sizes?: string;
  style?: React.CSSProperties;
}) {
  return <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes={sizes} className={className} style={style} />;
}

function Cta({ children = "Get Your FREE Art Print" }: { children?: React.ReactNode }) {
  return (
    <a
      href="#choose"
      className="inline-block bg-vibe px-8 py-4 font-display text-xl text-white shadow-[0_0_30px_-5px] shadow-vibe-bright/60 hover:bg-vibe-bright"
    >
      {children}
    </a>
  );
}

const PERKS = [
  "Choose your FREE 5x7 art print from the 5 options below",
  "Get your art print delivered right to your door",
  "Just pay shipping",
  "FREE bonus - Collectors club lifetime discount",
];

const TESTIMONIALS = [
  { name: "Chris", image: "chris", quote: "Stoked to have a high quality print from such a unique creative. Thanks Steve!" },
  {
    name: "Janet Dobbelstein",
    image: "auntjanetreview",
    quote:
      "This art was purchased for my brother who was going to have open heart surgery. He was really touched by the sentiment & I think I even saw a tear in his eye when he opened it. All the nurses & doctors loved it too! This was an awesome way to bring my brother some cheer during his recovery!",
  },
  {
    name: "Gavin",
    image: "gavin",
    quote:
      "My print is an incredible mix of bold geometry and vibrant colors that instantly grabs your attention. The textures and layers give it so much depth and energy—it’s modern, eye-catching, and full of life. Perfect for anyone looking to add something truly unique to their space.",
  },
  { name: "Matthew Kimler", image: "reviewm", quote: "Awesome artwork and it was delivered very quickly." },
  { name: "Andrew Barsi", image: "reviewa", quote: "High quality print. Super trippy!" },
];

const STEPS = [
  "Scroll down to see the artwork options",
  "Choose your favorite print below (limited to 1 per person, please)",
  "Pick your size and enter your address on the following page",
  "Just pay shipping",
  "Receive your new piece of art and have it on your wall in 14 business days or less",
];

const FEATURES = [
  "Official and certified replications of the original acrylic paintings",
  "Printed on thick, high-quality gloss poster paper",
  "The option to upgrade the size of your art print",
  "Limited-time discount only available while supplies last!",
  "100% risk-free money-back guarantee",
];

/** A photo beside a block of text, alternating sides like the original funnel layout. */
function PhotoRow({
  img,
  side,
  maxWidth,
  children,
}: {
  img: Img;
  side: "left" | "right";
  /** Caps the photo at this width in px instead of filling its half. */
  maxWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <Pic
        img={img}
        sizes={maxWidth ? `${maxWidth}px` : "(min-width: 768px) 50vw, 100vw"}
        style={maxWidth ? { maxWidth } : undefined}
        className={`w-full ${maxWidth ? "mx-auto" : ""} ${side === "right" ? "md:order-2" : ""}`}
      />
      <div>{children}</div>
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <CheckIcon className="mt-1 size-5 shrink-0 text-vibe-bright" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Pic
          img={siteImage("2024colectionhorazontaledit", "The five paintings of the Open collection")}
          sizes="100vw"
          className="h-56 w-full object-cover opacity-80 sm:h-96"
        />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-8">
          <p className="text-center font-display text-sun">Limited Time Offer</p>
          <h1 className="mt-2 text-center text-4xl leading-tight text-vibe sm:text-6xl">
            Uncover the Cosmic Connection in a Free Artwork for Your Space!
          </h1>
          <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
            <Pic img={siteImage("groupshot", "Steve with the Open collection")} />
            <div>
              <p className="mb-5 font-display text-xl underline underline-offset-4">Limited time offer</p>
              <CheckList items={PERKS} />
              <div className="mt-8">
                <Cta />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hello */}
      <section className="bg-forest px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-4xl">Hello! I&apos;m Steve 👋</h2>
          <p className="mt-3 text-xl">and I want you to have a FREE print from my collection</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              siteImage("portalwall", "Portal print hanging on a wall"),
              siteImage("screenshot-20230520-091301-instagram", "Steve painting live"),
              siteImage("dualitywall4x5", "Duality print hanging on a wall"),
            ].map((img) => (
              <Pic key={img.src} img={img} className="aspect-[4/5] w-full object-cover" />
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl">Recognized &amp; Trusted By</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
            <Pic img={siteImage("tjoltlogo", "The Journal of Lost Time")} sizes="208px" className="h-44 w-auto sm:h-52" />
            {/* Big Duck's dark green lettering needs a light backdrop on the black page. */}
            <div className="rounded bg-white p-4">
              <Pic img={siteImage("big-duck-logopng", "Big Duck Canvas")} sizes="176px" className="h-36 w-auto sm:h-44" />
            </div>
            <Pic
              img={siteImage("becomingboarderlesstdn", "Becoming Borderless on The Design Network")}
              sizes="370px"
              className="h-44 w-auto sm:h-52"
            />
          </div>

          <div className="mt-20 grid items-start gap-x-6 gap-y-20 md:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="relative bg-forest px-6 pb-8 pt-16 text-center">
                <Pic
                  img={siteImage(t.image, t.name)}
                  sizes="96px"
                  className="absolute -top-12 left-1/2 size-24 -translate-x-1/2 rounded-full border-4 border-ink object-cover"
                />
                <blockquote className="leading-relaxed">“{t.quote}”</blockquote>
                <Pic img={siteImage("5starsgold", "5 stars")} sizes="100px" className="mx-auto mt-5 h-4 w-auto" />
                <figcaption className="mt-3 font-display">{t.name}</figcaption>
              </figure>
            ))}
            <Pic
              img={siteImage("certifiedvibe", "Certified Continuous Vibe sticker")}
              sizes="(min-width: 768px) 25vw, 60vw"
              className="mx-auto w-2/3 max-w-xs rounded-full"
            />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-forest px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl text-vibe sm:text-4xl">Have you ever had a mind opening experience?…</h2>
          <div className="mt-10 space-y-14 leading-relaxed">
            <PhotoRow img={siteImage("img-6717", "Steve's converted school bus")} side="left" maxWidth={320}>
              <p>
                After a summer anchored to a tiki bar along the Arkansas River in Colorado, I felt the road calling me
                again. I packed up my self-converted school bus and pointed it south toward New Mexico, craving warmth
                and the freedom of movement. When I arrived in Santa Fe, a visit to Meow Wolf—a labyrinthine art
                installation pulsing with light, sound, and texture—changed everything. Each room seemed alive,
                vibrating with energies that played with perception, twisting the way I felt and thought.
              </p>
            </PhotoRow>
            <PhotoRow img={siteImage("20231005-172822", "Painting in progress")} side="right" maxWidth={320}>
              <p>
                That experience sparked a question in me: How do we truly see and feel the world around us? This
                became the heartbeat of my latest collection. I started by exploring the human body as our vessel of
                perception, grounding us in physical reality. As I progressed, my focus shifted inward, toward the
                spiritual currents flowing beneath the surface of existence.
              </p>
            </PhotoRow>
            <PhotoRow img={siteImage("heart", "The Heart painting")} side="left" maxWidth={320}>
              <p>
                I chose acrylic and spray paint, mixing neon hues with stark black and white. The neon represented
                spiritual energy, the unseen forces that connect us, while black and white embodied the raw dichotomy
                of life. Layering tape gave dimension, blending the physical with the spiritual, as if merging two
                realms on the canvas. With each piece, I aimed to leave viewers questioning the fabric of reality,
                pushing them to look deeper—not just at the art, but at life itself.
              </p>
            </PhotoRow>
          </div>
        </div>
      </section>

      {/* Why + steps */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl space-y-16">
          <PhotoRow img={siteImage("dualityportal", "Duality and Portal prints")} side="left">
            <h2 className="text-3xl text-vibe">So, why give away free art prints?</h2>
            <p className="mt-5 leading-relaxed">
              I believe art is a scaffolding for the viewer to project their personal human experience onto. So as an
              artist my goal is to create art that reflects the human experience. I believe the human experience is a
              universal experience. I believe everyone should have a chance to explore themselves deeper through art.
            </p>
          </PhotoRow>
          <PhotoRow img={siteImage("heartvission", "Heart and Vision prints framed in a home")} side="right" maxWidth={400}>
            <h2 className="text-3xl text-vibe">Interested? Here are the next steps…</h2>
            <ol className="mt-5 list-decimal space-y-2 pl-6">
              {STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-5 text-mute">
              If you have any questions please reach out at{" "}
              <a href={`mailto:${site.email}`} className="underline">{site.email}</a>. Thank you so much for taking the
              time to read this, I can’t wait to get your new piece of art to you!
            </p>
          </PhotoRow>
        </div>
      </section>

      {/* Guarantee */}
      <section className="bg-forest px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl">You&apos;ll Be Glad To Know That</h2>
          <p className="mt-3 text-xl">I also have the best guarantee you&apos;ll ever see:</p>
          <div className="mt-10 grid gap-6 text-left md:grid-cols-2">
            <div className="border-2 border-vibe p-6">
              <h3 className="text-2xl text-vibe">1. You&apos;ll love it.</h3>
              <p className="mt-4 leading-relaxed">
                I fully guarantee you’ll love what you receive or I’ll refund your shipping &amp; handling and you can
                keep the print anyway (or gift it to a loved one).
              </p>
              <p className="mt-4 leading-relaxed">
                I love creating my art, so I want you to love what you receive just as much as I love creating it -
                that’s why I&apos;m offering this guarantee.
              </p>
            </div>
            <div className="border-2 border-vibe p-6">
              <h3 className="text-2xl text-vibe">2. And if you don&apos;t…</h3>
              <p className="mt-4 leading-relaxed">
                All you’d have to do is contact me directly using the details on your receipt and I’ll give you back
                every penny. Which I’m grateful to say has never had to happen yet!
              </p>
              <p className="mt-4 leading-relaxed">
                So this truly is a risk-free offer. (Just a heartfelt piece of art from me to you!) My true hope is that
                you’ll love what you receive and this will be the beginning of a great relationship for years to come.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open collection */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-5xl text-vibe">OPEN Collection</h2>
          <Pic
            img={siteImage("steveshade1x1", "Steve Knopf")}
            sizes="(min-width: 768px) 512px, 100vw"
            className="mx-auto mt-10 w-full max-w-lg"
          />
          <p className="mt-10 leading-relaxed">
                The &quot;Open&quot; collection seeks to delve deeply into the intricate relationship between the mind
                and the body, shedding light on how these two aspects of our being work together to shape our
                experiences of reality. By investigating this dynamic interplay, the collection aims to question and
                illuminate the ways we perceive the world around us, how we process these perceptions mentally, and how
                they manifest in our physical existence. This exploration invites a broader reflection on human
                consciousness and embodiment, suggesting that our connection to the larger whole—whether it be society,
                nature, or the cosmos—depends on this essential harmony.
          </p>
          <div className="mt-14 space-y-14">
            <PhotoRow img={siteImage("collection", "The five Open collection paintings")} side="left">
              <p className="leading-relaxed">
                This collection features five distinct acrylic paintings blending organic and geometric forms with
                vibrant colors and intricate patterns. This collection explores themes of life, death, and the blending
                of organic and technological worlds. Each piece will open your space to the realms beyond. This
                collection holds up a mirror to the human experience, giving you an opportunity to explore yourself
                deeper.
              </p>
            </PhotoRow>
            <PhotoRow img={siteImage("cosmicduality1x1", "Cosmic Child and Duality prints framed in a home")} side="left">
              <h3 className="text-2xl">All you have to do is… 👇🏼</h3>
              <p className="mt-3">Choose your favorite 5x7 art print from one of the 5 options below.</p>
              <div className="mt-5">
                <CheckList items={FEATURES} />
              </div>
              <h3 className="mt-8 text-2xl">Plus you get access to bonuses 👇🏼</h3>
              <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-vibe">
                <li><strong>FREE BONUS</strong> - access to the Continuous Vibe collectors club</li>
                <li><strong>FREE BONUS</strong> - money back guarantee</li>
              </ul>
            </PhotoRow>
          </div>
        </div>
      </section>

      {/* Choose */}
      <section id="choose" className="scroll-mt-20 bg-forest px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-4xl text-vibe sm:text-5xl">Choose Your Print Below</h2>
          <div className="mt-12 space-y-10">
            {openCollection.map((a, i) => {
              // Alternate sides like the original funnel: image left, then image right, ...
              const imageRight = i % 2 === 1;
              return (
                <article key={a.slug} className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10">
                  <Pic
                    img={siteImage(funnelMockups[a.slug], `${a.title} print mockup`)}
                    sizes="(min-width: 640px) 448px, 100vw"
                    className={`aspect-square w-full object-cover ${imageRight ? "sm:order-2" : ""}`}
                  />
                  <div className={imageRight ? "sm:text-right" : ""}>
                    <h3 className="text-3xl text-vibe">&quot;{a.title}&quot;</h3>
                    <p className="mt-3 leading-relaxed text-mute">{a.description[0]}</p>
                    <p className="mt-5 text-xl">
                      <s className="text-vibe">{formatMoney(printPrices["5x7"])}</s>{" "}
                      <span className="font-display text-sun">{formatMoney(smallPrint.price)}!</span>
                    </p>
                    <p className="text-sm text-mute">+ {formatMoney(smallPrint.shipping)} US shipping &amp; handling fee</p>
                    <Link
                      href={`/free-print/${a.slug}`}
                      className="mt-5 inline-block bg-vibe px-6 py-3 text-center font-display text-lg text-white hover:bg-vibe-bright"
                    >
                      Order &quot;{a.title}&quot;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto grid max-w-4xl items-start gap-8 sm:grid-cols-[1fr_2.5fr]">
          <Pic
            img={siteImage("becomingboardedlessthumbnailedit", "Steve Knopf in his bus")}
            sizes="(min-width: 640px) 256px, 100vw"
            className="w-full"
          />
          <div>
            <h2 className="text-4xl text-vibe">About Steve</h2>
            <p className="mt-5 leading-relaxed">
              Steve is a psychedelic surrealist painter celebrated for his vibrant neon art and dynamic black light
              effects. His work transforms into glowing, otherworldly experiences by blending art and light. With nine
              years of welding experience, he incorporates meticulous craftsmanship and an industrial edge into his art,
              bridging traditional and modern aesthetics. Living in a self-converted school bus, Steve’s nomadic
              lifestyle fuels his creativity and connects him with diverse communities. His live painting performances
              at festivals showcase his talent for creating interactive, immersive experiences. His art invites viewers
              into a surreal realm where dimensions blur and perspectives shift, offering a captivating journey into
              the unknown.
            </p>
          </div>
          <a
            href="#choose"
            className="block bg-vibe px-8 py-4 text-center font-display text-xl text-white hover:bg-vibe-bright sm:col-span-2"
          >
            Get Your FREE! Art Print
          </a>
        </div>
      </section>
    </>
  );
}
