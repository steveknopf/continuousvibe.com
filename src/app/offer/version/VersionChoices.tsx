"use client";

import Image from "next/image";
import { useState } from "react";
import { formatMoney, type Img } from "@/lib/catalog";
import { OfferButtons } from "../OfferButtons";

export type VersionChoice = { pick: number; name: string; price: number; regular: number; image: Img };

/** The offered prints as select cards (all picked to start), with a live total. */
export function VersionChoices({ order, items }: { order: string; items: VersionChoice[] }) {
  const [picked, setPicked] = useState<number[]>(items.map((i) => i.pick));
  const chosen = items.filter((i) => picked.includes(i.pick));
  const total = chosen.reduce((s, i) => s + i.price, 0);
  const regular = chosen.reduce((s, i) => s + i.regular, 0);
  const several = items.length > 1;

  const toggle = (pick: number) =>
    setPicked((p) => (p.includes(pick) ? p.filter((x) => x !== pick) : [...p, pick].sort()));

  return (
    <>
      {several && <p className="mt-8 text-mute">Add both, or tap a print to take just one.</p>}
      <ul className={`mt-6 grid gap-6 ${several ? "sm:grid-cols-2" : ""}`}>
        {items.map((item) => {
          const on = picked.includes(item.pick);
          const card = (
            <>
              <Image
                src={item.image.src}
                alt={item.image.alt}
                width={item.image.width}
                height={item.image.height}
                sizes="(min-width: 768px) 360px, 100vw"
                preload
                className="mx-auto w-full max-w-xl"
              />
              <span className="mt-4 flex items-center justify-center gap-3 text-xl">
                {several && (
                  <span
                    aria-hidden
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      on ? "border-vibe-bright bg-vibe-bright text-white" : "border-cream"
                    }`}
                  >
                    {on && (
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="m6 12 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                )}
                {item.name}
              </span>
              <span className="mt-1 block">
                <s className="text-mute">{formatMoney(item.regular)}</s>{" "}
                <span className="font-display text-2xl text-sun">{formatMoney(item.price)}</span>
              </span>
            </>
          );
          return (
            <li key={item.pick}>
              {several ? (
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(item.pick)}
                  className={`block w-full border-2 p-4 transition ${on ? "border-vibe-bright bg-vibe/10" : "border-line opacity-70 hover:opacity-100"}`}
                >
                  {card}
                </button>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-10 font-display text-5xl text-sun">
        {chosen.length === 0 ? "Pick a print" : `${chosen.length > 1 ? "Both for" : "Now only"} ${formatMoney(total)}`}
      </p>
      {regular > total && (
        <p className="mt-3 text-xl italic text-vibe-bright">Save {formatMoney(regular - total)} — only available on this page.</p>
      )}
      <div className="mt-10">
        <OfferButtons
          order={order}
          offer="version"
          nextPath="/offer/stickers"
          picks={picked}
          disabled={chosen.length === 0}
          acceptLabel={chosen.length ? `Add to order · ${formatMoney(total)}` : "Add to order"}
        />
      </div>
    </>
  );
}
