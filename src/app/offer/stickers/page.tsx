import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { stickerUpsell } from "@/config/offers";
import { formatMoney, products, siteImage } from "@/lib/catalog";
import { getOrder } from "@/lib/orders";
import { CheckoutSteps, orderParam, OrderNotFound, StepLoading } from "@/components/CheckoutSteps";
import { OfferButtons } from "../OfferButtons";

// Checkout step 2b: sticker pack offer. Nothing is charged until the review page.

export const metadata: Metadata = { title: "Add the sticker pack", robots: { index: false } };

export default function StickerOfferPage({ searchParams }: PageProps<"/offer/stickers">) {
  return (
    <>
      <CheckoutSteps step={2} />
      <Suspense fallback={<StepLoading />}>
        <StickerOffer searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function StickerOffer({ searchParams }: Pick<PageProps<"/offer/stickers">, "searchParams">) {
  const order = await getOrder(orderParam(await searchParams));
  if (!order) return <OrderNotFound />;

  const stickers = products.filter((p) => p.category === "stickers");
  const regular = stickers.reduce((sum, p) => sum + p.price, 0);
  const each = stickers[0]?.price ?? 0;
  const price = stickerUpsell.price;
  const pack = siteImage("stickerpack1x1", "The 4 Continuous Vibe stickers");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-8">
      <p className="text-sm text-vibe-bright">
        Please don&apos;t leave this page or press the back button yet. Doing so may glitch your order.
      </p>
      <h1 className="mt-6 text-3xl leading-tight sm:text-5xl">
        Do you want to add the Continuous Vibe exclusive sticker pack?
      </h1>
      <Image
        src={pack.src}
        alt={pack.alt}
        width={pack.width}
        height={pack.height}
        sizes="(min-width: 768px) 560px, 100vw"
        preload
        className="mx-auto mt-8 w-full max-w-xl"
      />
      <p className="mt-3 text-sm italic text-mute">(stickers sell on my website for {formatMoney(each)} each)</p>
      <p className="mt-6 text-xl">
        Get your {stickers.length} custom stickers to continue the vibes <s className="text-mute">{formatMoney(regular)}</s>
      </p>
      <p className="mt-4 font-display text-5xl text-sun">Now only {formatMoney(price)}</p>
      {regular > price && (
        <p className="mt-3 text-xl italic text-vibe-bright">
          Save {formatMoney(regular - price)} — only available on this page.
        </p>
      )}
      <div className="mt-10">
        <OfferButtons
          order={order.id}
          offer="stickers"
          nextPath="/review"
          acceptLabel={`Add to order · ${formatMoney(price)}`} />
      </div>
    </div>
  );
}
