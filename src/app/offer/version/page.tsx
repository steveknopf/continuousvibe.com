import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { printPrices } from "@/config/offers";
import { getArtwork } from "@/lib/catalog";
import { getOrder, versionOfferItems } from "@/lib/orders";
import { CheckoutSteps, orderParam, OrderNotFound, StepLoading } from "@/components/CheckoutSteps";
import { VersionChoices, type VersionChoice } from "./VersionChoices";

// Checkout step 2a: offer for the other lighting (Daylight/Blacklight) of the prints
// they bought. Orders with nothing to offer go straight on to the sticker pack.

export const metadata: Metadata = { title: "Complete the set", robots: { index: false } };

export default function VersionOfferPage({ searchParams }: PageProps<"/offer/version">) {
  return (
    <>
      <CheckoutSteps step={2} />
      <Suspense fallback={<StepLoading />}>
        <VersionOffer searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function VersionOffer({ searchParams }: Pick<PageProps<"/offer/version">, "searchParams">) {
  const order = await getOrder(orderParam(await searchParams));
  if (!order) return <OrderNotFound />;

  const items = versionOfferItems(order);
  if (items.length === 0) redirect(`/offer/stickers?order=${encodeURIComponent(order.id)}`);

  const versions = [...new Set(items.map((i) => i.version.toLowerCase()))];
  const headline =
    versions.length === 1
      ? `Want the ${versions[0]} version${items.length > 1 ? "s" : ""} too?`
      : "Want the other versions too?";
  const choices: VersionChoice[] = items.map((item, pick) => {
    const art = getArtwork(item.slug)!;
    const light = item.version.toLowerCase() === "blacklight" ? "blacklight" : "daylight";
    const src = art.photos?.[light] ?? art.images[0].src;
    const img = art.images.find((i) => i.src === src) ?? art.images[0];
    return {
      pick,
      name: item.name,
      price: item.price,
      regular: printPrices[item.format] ?? item.price,
      image: { ...img, alt: `${art.title} ${item.format} print, ${item.version.toLowerCase()} version` },
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-8">
      <p className="text-sm text-vibe-bright">
        Please don&apos;t leave this page or press the back button yet. Doing so may glitch your order.
      </p>
      <h1 className="mt-6 text-3xl leading-tight sm:text-5xl">{headline}</h1>
      <p className="mx-auto mt-4 max-w-xl leading-relaxed text-mute">
        Every painting glows differently under blacklight and daylight. Complete the pair and hang them side by side,
        or give one as a gift. They ship in the same package as your order.
      </p>
      <VersionChoices order={order.id} items={choices} />
    </div>
  );
}
