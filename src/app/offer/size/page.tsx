import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { printPrices, sizeUpsell } from "@/config/offers";
import { formatMoney, getArtwork } from "@/lib/catalog";
import { getOrder, sizeOfferItem } from "@/lib/orders";
import { CheckoutSteps, orderParam, OrderNotFound, StepLoading } from "@/components/CheckoutSteps";
import { OfferButtons } from "../OfferButtons";

// Checkout step 2, first offer: upgrade a lone 5x7 print to the 8x10. Orders that don't qualify go
// straight on to the version offer, which then follows whichever size they chose.

export const metadata: Metadata = { title: "Go bigger", robots: { index: false } };

export default function SizeOfferPage({ searchParams }: PageProps<"/offer/size">) {
  return (
    <>
      <CheckoutSteps step={2} />
      <Suspense fallback={<StepLoading />}>
        <SizeOffer searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SizeOffer({ searchParams }: Pick<PageProps<"/offer/size">, "searchParams">) {
  const order = await getOrder(orderParam(await searchParams));
  if (!order) return <OrderNotFound />;

  const upgrade = sizeOfferItem(order);
  if (!upgrade) redirect(`/offer/version?order=${encodeURIComponent(order.id)}`);

  const art = getArtwork(upgrade.from.slug!)!;
  const light = upgrade.from.version?.toLowerCase() === "blacklight" ? "blacklight" : "daylight";
  // The size comparison mockup shows the 5x7 and 8x10 side by side; fall back to the painting photo.
  const src = art.mockups?.[light]?.sizeComparison ?? art.photos?.[light] ?? art.images[0].src;
  const img = art.images.find((i) => i.src === src) ?? art.images[0];
  const regular = printPrices[sizeUpsell.to];
  const extra = sizeUpsell.price - upgrade.from.unitAmount;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-8">
      <p className="text-sm text-vibe-bright">
        Please don&apos;t leave this page or press the back button yet. Doing so may glitch your order.
      </p>
      <h1 className="mt-6 text-3xl leading-tight sm:text-5xl">Want to go bigger?</h1>
      <p className="mx-auto mt-4 max-w-xl leading-relaxed text-mute">
        The detail in my work really comes alive at a larger size. Swap your {sizeUpsell.from} for the {sizeUpsell.to}{" "}
        of the same print and give it the space it deserves on your wall.
      </p>

      <figure className="mt-8">
        <Image
          src={img.src}
          alt={`${art.title} ${sizeUpsell.from} and ${sizeUpsell.to} prints side by side`}
          width={img.width}
          height={img.height}
          sizes="(min-width: 768px) 576px, 100vw"
          className="mx-auto w-full max-w-xl"
        />
        <figcaption className="mt-3">{upgrade.to.name}</figcaption>
      </figure>

      <p className="mt-8 font-display text-4xl text-sun sm:text-5xl">
        {regular > sizeUpsell.price && <s className="mr-3 text-2xl text-mute">{formatMoney(regular)}</s>}
        Now only {formatMoney(sizeUpsell.price)}
      </p>
      <p className="mt-2 italic text-vibe-bright">
        Just {formatMoney(extra)} more than your {sizeUpsell.from} — only available on this page.
      </p>

      <div className="mt-8">
        <OfferButtons
          order={order.id}
          offer="size"
          acceptLabel={`Upgrade to ${sizeUpsell.to} · ${formatMoney(sizeUpsell.price)}`}
          nextPath="/offer/version"
        />
      </div>
    </div>
  );
}
