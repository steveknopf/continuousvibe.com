"use client";

import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Img } from "@/lib/catalog";

export type PaintingCard = {
  slug: string;
  title: string;
  image: Img;
  note: string;
  hasPrints: boolean;
  /** The original is for sale (not sold). */
  hasOriginal: boolean;
};

const SHOW = [
  { id: "all", label: "All paintings and prints" },
  { id: "prints", label: "Prints available" },
  { id: "originals", label: "Originals available" },
] as const;

const SORT = [
  { id: "newest", label: "Newest to oldest" },
  { id: "oldest", label: "Oldest to newest" },
] as const;

type Show = (typeof SHOW)[number]["id"];
type Sort = (typeof SORT)[number]["id"];

/** The store's paintings with a Filter pop-up for Show and Sort. `cards` arrive newest first. */
export function PaintingsGrid({ cards }: { cards: PaintingCard[] }) {
  const [show, setShow] = useState<Show>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on a click outside the menu or on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = cards.filter((c) => show === "all" || (show === "prints" ? c.hasPrints : c.hasOriginal));
  const visible = sort === "newest" ? filtered : [...filtered].reverse();
  const changed = show !== "all" || sort !== "newest";

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div ref={wrapRef} className="relative">
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="store-filter-menu"
            onClick={() => setOpen((o) => !o)}
            className={`flex items-center gap-2 border-2 px-4 py-2 font-display hover:border-vibe-bright ${
              open ? "border-vibe-bright" : "border-line"
            }`}
          >
            <FilterIcon />
            Filter
            {changed && <span className="size-2 rounded-full bg-vibe-bright" aria-label="(filter on)" />}
          </button>

          {open && (
            <div
              id="store-filter-menu"
              role="dialog"
              aria-label="Filter paintings"
              className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] border-2 border-line bg-forest p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
            >
              <Choices legend="Show" name="store-show" options={SHOW} value={show} onChange={setShow} />
              <div className="mt-5">
                <Choices legend="Sort" name="store-sort" options={SORT} value={sort} onChange={setSort} />
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={!changed}
                  onClick={() => {
                    setShow("all");
                    setSort("newest");
                  }}
                  className="text-sm text-mute underline hover:text-cream disabled:no-underline disabled:opacity-40"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className="bg-vibe px-5 py-2 font-display text-white hover:bg-vibe-bright"
                >
                  Show {visible.length}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-mute" role="status">
          {visible.length} {visible.length === 1 ? "painting" : "paintings"}
          {changed && (
            <>
              {" · "}
              {SHOW.find((o) => o.id === show)!.label.toLowerCase()}, {SORT.find((o) => o.id === sort)!.label.toLowerCase()}
            </>
          )}
        </p>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
          {visible.map((c) => (
            <ProductCard key={c.slug} href={`/store/${c.slug}`} image={c.image} title={c.title} note={c.note} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-mute">No paintings match this filter.</p>
      )}
    </>
  );
}

function Choices<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm uppercase tracking-widest text-mute">{legend}</legend>
      <div className="grid gap-1">
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-3 py-1 hover:text-vibe-bright">
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="size-4 accent-vibe-bright"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5Z" />
    </svg>
  );
}
