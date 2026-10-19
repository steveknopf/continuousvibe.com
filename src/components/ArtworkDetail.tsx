"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cart } from "@/lib/cart";
import { formatMoney, type Artwork, type FormatOption } from "@/lib/catalog";
import { ImageGallery } from "@/components/ImageGallery";

type Props = {
  artwork: Artwork;
  options: FormatOption[];
  /** "store" adds to the cart; "funnel" is the free print size selection and goes straight to checkout. */
  mode: "store" | "funnel";
};

export function ArtworkDetail({ artwork, options, mode }: Props) {
  const firstAvailable = options.find((o) => o.available)?.format ?? options[0].format;
  const [format, setFormat] = useState(firstAvailable);
  const [version, setVersion] = useState(artwork.printVersions?.[0]);
  const [status, setStatus] = useState<"idle" | "busy" | "added">("idle");
  const router = useRouter();

  const selected = options.find((o) => o.format === format)!;
  const isPrint = format !== "original";
  const showVersions = isPrint && artwork.printVersions && artwork.printVersions.length > 1;

  function checkout() {
    setStatus("busy");
    const params = new URLSearchParams({ kind: "funnel", slug: artwork.slug, format });
    if (isPrint && version) params.set("version", version);
    router.push(`/checkout?${params}`);
  }

  function addToCart() {
    cart.add({
      type: "artwork",
      slug: artwork.slug,
      format,
      version: isPrint ? version : undefined,
      title: artwork.title,
      detail: [selected.label, isPrint ? version : undefined].filter(Boolean).join(" · "),
      unitPrice: selected.price,
      image: artwork.images[0].src,
      max: isPrint ? undefined : 1,
    });
    setStatus("added");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <ImageGallery images={artwork.images} />

      <div>
        {mode === "funnel" && <FunnelPitch options={options} />}

        <h1 className="text-4xl text-vibe sm:text-5xl">{artwork.title}</h1>

        <fieldset className="mt-8">
          <legend className="mb-3 font-display text-xl">Choose a size</legend>
          <div className="grid gap-3">
            {options.map((o) => (
              <label
                key={o.format}
                className={`flex cursor-pointer items-center justify-between gap-4 border-2 px-5 py-4 transition ${
                  o.askForPrice
                    ? "cursor-default border-line"
                    : !o.available
                    ? "cursor-not-allowed border-line opacity-50"
                    : format === o.format
                      ? "border-vibe-bright bg-vibe/10"
                      : "border-line hover:border-vibe"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="format"
                    value={o.format}
                    checked={format === o.format}
                    disabled={!o.available}
                    onChange={() => {
                      setFormat(o.format);
                      setStatus("idle");
                    }}
                    className="size-5 accent-vibe-bright"
                  />
                  <span>{o.label}</span>
                  {mode === "funnel" && o.format === "8x10" && (
                    <span className="bg-sun px-2 py-0.5 text-sm font-semibold text-ink">Best value</span>
                  )}
                </span>
                <span className="text-right">
                  {o.askForPrice ? (
                    <Link href="/contact" className="text-vibe-bright underline">
                      Ask for price
                    </Link>
                  ) : !o.available ? (
                    "Sold"
                  ) : (
                    <>
                      {o.compareAt && <s className="mr-2 text-mute">{formatMoney(o.compareAt)}</s>}
                      <span className="font-semibold">{formatMoney(o.price)}</span>
                      {o.shipping !== undefined && (
                        <span className="block text-sm text-mute">
                          {o.shipping === 0 ? "+ FREE S&H" : `+ ${formatMoney(o.shipping)} S&H`}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {showVersions && (
          <fieldset className="mt-6">
            <legend className="mb-3 font-display text-xl">Print version</legend>
            <div className="flex flex-wrap gap-3">
              {artwork.printVersions!.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={version === v}
                  onClick={() => setVersion(v)}
                  className={`border-2 px-4 py-2 ${version === v ? "border-vibe-bright bg-vibe/10" : "border-line hover:border-vibe"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-8">
          {mode === "funnel" ? (
            <button
              type="button"
              onClick={checkout}
              disabled={status === "busy"}
              className="w-full bg-vibe px-6 py-4 font-display text-xl text-white hover:bg-vibe-bright disabled:opacity-60"
            >
              {status === "busy"
                ? "Loading checkout…"
                : `Continue to checkout · ${formatMoney(selected.price)}${selected.shipping ? ` + ${formatMoney(selected.shipping)} S&H` : ""}`}
            </button>
          ) : (
            <>
              {selected.askForPrice ? (
                <Link
                  href="/contact"
                  className="block w-full bg-vibe px-6 py-4 text-center font-display text-xl text-white hover:bg-vibe-bright"
                >
                  Ask about this original
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!selected.available}
                  className="w-full bg-vibe px-6 py-4 font-display text-xl text-white hover:bg-vibe-bright disabled:opacity-60"
                >
                  {selected.available ? `Add to cart · ${formatMoney(selected.price)}` : "Sold"}
                </button>
              )}
              {status === "added" && (
                <p className="mt-3 text-center" role="status">
                  Added! <Link href="/cart" className="text-vibe-bright underline">View cart</Link>
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-10 space-y-4 leading-relaxed text-mute">
          {artwork.description.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {artwork.bullets.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {artwork.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelPitch({ options }: { options: FormatOption[] }) {
  const big = options.find((o) => o.format === "8x10");
  return (
    <div className="mb-8 border-2 border-sun/60 bg-sun/5 p-5">
      <p className="font-display text-sun">Limited time offer · They look much better bigger!</p>
      <p className="mt-3 leading-relaxed">
        Your free print is the 5x7. To really see the detail in my work, the prints look better a little bigger.
        {big?.compareAt && (
          <>
            {" "}My 8x10 prints sell for {formatMoney(big.compareAt)} on the store, but right here you can upgrade for only{" "}
            <strong>{formatMoney(big.price)}</strong> with free shipping. Taking me up on it also supports me as an
            independent artist. 😊
          </>
        )}
      </p>
    </div>
  );
}
