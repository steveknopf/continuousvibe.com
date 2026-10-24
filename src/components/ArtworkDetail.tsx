"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cart } from "@/lib/cart";
import { formatMoney, type Artwork, type FormatOption } from "@/lib/catalog";
import { ImageGallery } from "@/components/ImageGallery";
import { shipping } from "@/config/offers";
import { originalShipping } from "@/lib/shipping";

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

type Line = { format: string; version?: string; qty: number; option: FormatOption };

export function ArtworkDetail({ artwork, options: allOptions, mode }: Props) {
  const multi = mode === "store";
  // In the store the original comes first and is selected by default; the free print funnel keeps prints first.
  const options = multi
    ? [...allOptions.filter((o) => o.format === "original"), ...allOptions.filter((o) => o.format !== "original")]
    : allOptions;
  const versionsAll = artwork.printVersions && artwork.printVersions.length > 1 ? artwork.printVersions : [];
  const firstAvailable = options.find((o) => o.available && !o.askForPrice)?.format ?? options[0].format;

  // Store: any mix of sizes and versions. Funnel: one size, one version.
  const [formats, setFormats] = useState<string[]>([firstAvailable]);
  const [versions, setVersions] = useState<string[]>(versionsAll.slice(0, 1));
  const [focus, setFocus] = useState<{ format: string; version?: string }>({ format: firstAvailable, version: versionsAll[0] });
  // Quantity for each print size and version.
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"idle" | "busy" | "added">("idle");
  const router = useRouter();

  const qtyKey = (f: string, v?: string) => `${f}:${v ?? ""}`;
  const printVersionsFor = (f: string) => (f === "original" || versionsAll.length === 0 ? [undefined] : versions);
  const lines: Line[] = options
    .filter((o) => formats.includes(o.format) && o.available && !o.askForPrice)
    .flatMap((o) =>
      printVersionsFor(o.format).map((v) => ({
        format: o.format,
        version: v,
        qty: o.format === "original" ? 1 : (qtys[qtyKey(o.format, v)] ?? 1),
        option: o,
      })),
    );
  const total = lines.reduce((sum, l) => sum + l.option.price * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const anyPrint = formats.some((f) => f !== "original");
  const shownImage = imageFor(artwork, focus.format, focus.format === "original" ? undefined : focus.version);

  function toggleFormat(f: string) {
    setStatus("idle");
    if (!multi) {
      setFormats([f]);
      setFocus({ format: f, version: versions[0] });
      return;
    }
    if (formats.includes(f)) {
      const rest = formats.filter((x) => x !== f);
      setFormats(rest);
      if (focus.format === f && rest.length) setFocus({ format: rest[rest.length - 1], version: versions[0] });
    } else {
      setFormats([...formats, f]);
      setFocus({ format: f, version: focus.version ?? versions[0] });
    }
  }

  function toggleVersion(v: string) {
    setStatus("idle");
    const printFormat = focus.format !== "original" ? focus.format : formats.find((f) => f !== "original");
    if (!multi) {
      setVersions([v]);
    } else if (versions.includes(v)) {
      // Keep at least one version selected.
      if (versions.length === 1) return;
      const rest = versions.filter((x) => x !== v);
      setVersions(rest);
      if (focus.version === v && printFormat) setFocus({ format: printFormat, version: rest[0] });
      return;
    } else {
      setVersions([...versions, v]);
    }
    if (printFormat) setFocus({ format: printFormat, version: v });
  }

  /** The photo in the print's own lighting, for the cart. */
  function cartImage(f: string, v?: string) {
    if (f === "original") return artwork.images[0].src;
    const light = v?.toLowerCase() === "blacklight" ? "blacklight" : "daylight";
    return artwork.photos?.[light] ?? artwork.photos?.daylight ?? artwork.photos?.blacklight ?? artwork.images[0].src;
  }

  function checkout() {
    const line = lines[0];
    if (!line) return;
    setStatus("busy");
    const params = new URLSearchParams({ kind: "funnel", slug: artwork.slug, format: line.format });
    if (line.version) params.set("version", line.version);
    router.push(`/checkout?${params}`);
  }

  function addToCart() {
    for (const l of lines) {
      const isPrint = l.format !== "original";
      cart.add(
        {
          type: "artwork",
          slug: artwork.slug,
          format: l.format,
          version: l.version,
          title: artwork.title,
          detail: [l.option.label, l.version].filter(Boolean).join(" · "),
          unitPrice: l.option.price,
          image: cartImage(l.format, l.version),
          max: isPrint ? undefined : 1,
        },
        l.qty,
      );
    }
    setQtys({});
    setStatus("added");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <ImageGallery images={artwork.images} selectedSrc={shownImage} />

      <div>
        {mode === "funnel" && <FunnelPitch options={options} />}

        <h1 className="text-4xl text-vibe sm:text-5xl">{artwork.title}</h1>

        <fieldset className="mt-8">
          <legend className="mb-3 font-display text-xl">{multi ? "Choose sizes" : "Choose a size"}</legend>
          {multi && <p className="-mt-1 mb-3 text-sm text-mute">Select as many as you like.</p>}
          <div className="grid gap-3">
            {options.map((o) => {
              const on = formats.includes(o.format);
              const disabled = !o.available || o.askForPrice;
              const rowVersions = printVersionsFor(o.format);
              const showSteppers = multi && on && !disabled && o.format !== "original";
              return (
                <div
                  key={o.format}
                  className={`border-2 transition ${
                    o.askForPrice
                      ? "border-line"
                      : !o.available
                        ? "border-line opacity-50"
                        : on
                          ? "border-vibe-bright bg-vibe/10"
                          : "border-line hover:border-vibe"
                  }`}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <label className={`flex flex-1 items-center gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type={multi ? "checkbox" : "radio"}
                        name="format"
                        value={o.format}
                        checked={on}
                        disabled={disabled}
                        onChange={() => toggleFormat(o.format)}
                        className={multi ? CHECK : "size-5 accent-vibe-bright"}
                      />
                      <span>{o.label}</span>
                      {mode === "funnel" && o.format === "8x10" && (
                        <span className="bg-sun px-2 py-0.5 text-sm font-semibold text-ink">Best value</span>
                      )}
                    </label>
                    {showSteppers && rowVersions.length === 1 && (
                      <QuantityStepper
                        value={qtys[qtyKey(o.format, rowVersions[0])] ?? 1}
                        onChange={(n) => setQtys((q) => ({ ...q, [qtyKey(o.format, rowVersions[0])]: n }))}
                      />
                    )}
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
                          {o.shipping !== undefined ? (
                            <span className="block text-sm text-mute">
                              {o.shipping === 0 ? "+ FREE S&H" : `+ ${formatMoney(o.shipping)} S&H`}
                            </span>
                          ) : (
                            multi &&
                            o.format === "original" && (
                              <span className="block text-sm text-mute">
                                {o.price >= shipping.freeOver
                                  ? "Free shipping"
                                  : `+ ${formatMoney(originalShipping(artwork.original?.size))} shipping`}
                              </span>
                            )
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  {showSteppers && rowVersions.length > 1 && (
                    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line px-5 py-3">
                      {rowVersions.map((v) => (
                        <div key={v} className="flex items-center gap-3">
                          <span className="text-sm text-mute">{v}</span>
                          <QuantityStepper
                            value={qtys[qtyKey(o.format, v)] ?? 1}
                            onChange={(n) => setQtys((q) => ({ ...q, [qtyKey(o.format, v)]: n }))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        {anyPrint && versionsAll.length > 0 && (
          <fieldset className="mt-6">
            <legend className="mb-3 font-display text-xl">Print version</legend>
            {multi && <p className="-mt-1 mb-3 text-sm text-mute">Pick one or both.</p>}
            <div className="flex flex-wrap gap-3">
              {versionsAll.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={versions.includes(v)}
                  onClick={() => toggleVersion(v)}
                  className={`border-2 px-4 py-2 ${versions.includes(v) ? "border-vibe-bright bg-vibe/10" : "border-line hover:border-vibe"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {multi && (
          <p className="mt-6 text-sm text-mute">
            Prints ship for {formatMoney(shipping.printsFlatRate)} per order. Originals ship by size. Free shipping on
            orders of {formatMoney(shipping.freeOver)} or more.
          </p>
        )}

        <div className="mt-8">
          {mode === "funnel" ? (
            <button
              type="button"
              onClick={checkout}
              disabled={status === "busy" || !lines[0]}
              className="w-full bg-vibe px-6 py-4 font-display text-xl text-white hover:bg-vibe-bright disabled:opacity-60"
            >
              {status === "busy"
                ? "Loading checkout…"
                : lines[0]
                  ? `Continue to checkout · ${formatMoney(lines[0].option.price)}${lines[0].option.shipping ? ` + ${formatMoney(lines[0].option.shipping)} S&H` : ""}`
                  : "Choose a size"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={addToCart}
                disabled={lines.length === 0}
                className="w-full bg-vibe px-6 py-4 font-display text-xl text-white hover:bg-vibe-bright disabled:opacity-60"
              >
                {lines.length === 0
                  ? "Select a size"
                  : count > 1
                    ? `Add ${count} items to cart · ${formatMoney(total)}`
                    : `Add to cart · ${formatMoney(total)}`}
              </button>
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

/** Round select button: an empty circle that fills red with a check mark when selected. */
const CHECK =
  "size-5 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-cream bg-transparent " +
  "checked:border-vibe-bright checked:bg-vibe-bright " +
  "checked:bg-[url(\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6 12 4 4 8-8' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")] " +
  "bg-center bg-no-repeat disabled:cursor-not-allowed";

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
