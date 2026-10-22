"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cart, useCart } from "@/lib/cart";
import { formatMoney, type Artwork, type FormatOption } from "@/lib/catalog";
import { ImageGallery } from "@/components/ImageGallery";

/**
 * The picture to show for a choice: the painting photo for the original, the print size
 * comparison for a 5x7/8x10, or the framed mockup for the 8x8. A print follows its
 * Daylight/Blacklight version when the painting has mockups for both.
 */
function imageFor(artwork: Artwork, format: string, version?: string) {
  if (format === "original" || !artwork.mockups) return artwork.images[0].src;
  const light = version?.toLowerCase() === "blacklight" ? "blacklight" : "daylight";
  const set = artwork.mockups[light] ?? artwork.mockups.daylight ?? artwork.mockups.blacklight;
  const pick = format === "8x8" ? (set?.framed ?? set?.sizeComparison) : (set?.sizeComparison ?? set?.framed);
  return pick ?? artwork.images[0].src;
}

type Props = {
  artwork: Artwork;
  options: FormatOption[];
  /** "store" adds to the cart; "funnel" is the free print size selection and goes straight to checkout. */
  mode: "store" | "funnel";
};

export function ArtworkDetail({ artwork, options: allOptions, mode }: Props) {
  // In the store the original comes first and is selected by default; the free print funnel keeps prints first.
  const options =
    mode === "store"
      ? [...allOptions.filter((o) => o.format === "original"), ...allOptions.filter((o) => o.format !== "original")]
      : allOptions;
  const firstAvailable = options.find((o) => o.available)?.format ?? options[0].format;
  const [format, setFormat] = useState(firstAvailable);
  const [version, setVersion] = useState(artwork.printVersions?.[0]);
  const [status, setStatus] = useState<"idle" | "busy" | "added">("idle");
  // Quantity to add, kept separately for each print size and version.
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const router = useRouter();
  const cartItems = useCart();
  /** How many of this print size and version are already in the cart. */
  const inCart = (v?: string) =>
    cartItems.find((i) => i.key === ["artwork", artwork.slug, format, v].filter(Boolean).join(":"))?.qty ?? 0;

  const selected = options.find((o) => o.format === format)!;
  const isPrint = format !== "original";
  const showVersions = isPrint && artwork.printVersions && artwork.printVersions.length > 1;
  const shownImage = imageFor(artwork, format, isPrint ? version : undefined);
  const qtyKey = `${format}:${isPrint ? (version ?? "") : ""}`;
  const qty = qtys[qtyKey] ?? 1;
  const setQty = (n: number) => setQtys((q) => ({ ...q, [qtyKey]: n }));

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
    }, isPrint ? qty : 1);
    setQty(1);
    setStatus("added");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <ImageGallery images={artwork.images} selectedSrc={shownImage} />

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
                {mode === "store" && o.format !== "original" && format === o.format && o.available && (
                  <QuantityStepper value={qty} onChange={setQty} />
                )}
                <span className="ml-auto text-right">
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
                  onClick={() => {
                    setVersion(v);
                    setStatus("idle");
                  }}
                  className={`relative border-2 px-4 py-2 ${version === v ? "border-vibe-bright bg-vibe/10" : "border-line hover:border-vibe"}`}
                >
                  {v}
                  {mode === "store" && inCart(v) > 0 && (
                    <span
                      className="absolute -right-2.5 -top-2.5 flex min-w-6 items-center justify-center rounded-full bg-vibe px-1.5 text-sm font-semibold leading-6 text-white"
                      aria-label={`${inCart(v)} in cart`}
                    >
                      {inCart(v)}
                    </span>
                  )}
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
                  {!selected.available
                    ? "Sold"
                    : isPrint && qty > 1
                      ? `Add ${qty} to cart · ${formatMoney(selected.price * qty)}`
                      : `Add to cart · ${formatMoney(selected.price)}`}
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

function QuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const btn = "flex size-8 items-center justify-center text-xl leading-none hover:text-vibe-bright disabled:opacity-30";
  return (
    <span className="flex items-center border-2 border-line" role="group" aria-label="Quantity">
      <button type="button" className={btn} disabled={value <= 1} onClick={(e) => (e.preventDefault(), onChange(value - 1))} aria-label="Fewer">
        −
      </button>
      <span className="w-7 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} disabled={value >= 20} onClick={(e) => (e.preventDefault(), onChange(value + 1))} aria-label="More">
        +
      </button>
    </span>
  );
}
