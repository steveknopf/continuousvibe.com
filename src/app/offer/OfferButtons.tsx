"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  order: string;
  offer: "version" | "stickers";
  acceptLabel: string;
  /** The page after this offer, e.g. "/offer/stickers". */
  nextPath: string;
  /** Version offer: which offered prints to add. */
  picks?: number[];
  /** Turns off the accept button (e.g. nothing picked). */
  disabled?: boolean;
};

/** Yes / no for an offer after checkout. Only records the choice: the card is charged on the review page. */
export function OfferButtons({ order, offer, acceptLabel, nextPath, picks, disabled = false }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState("");

  async function choose(accept: boolean) {
    setBusy(accept ? "accept" : "decline");
    setError("");
    const res = await fetch("/api/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order, offer, accept, picks: accept ? picks : undefined }),
    });
    const data = (await res.json()) as { order?: string; error?: string };
    if (!data.order) {
      setError(data.error ?? "Something went wrong.");
      setBusy(null);
      return;
    }
    router.push(`${nextPath}?order=${encodeURIComponent(data.order)}`);
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={() => choose(true)}
        disabled={busy !== null || disabled}
        className="w-full max-w-md bg-sun px-8 py-4 font-display text-2xl uppercase text-ink hover:brightness-110 disabled:opacity-60"
      >
        {busy === "accept" ? "Adding to your order…" : acceptLabel}
      </button>
      <p className="mt-2 text-sm text-mute">Nothing is charged yet. You can remove it on the review page.</p>
      {error && (
        <p className="mt-3 text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => choose(false)}
        disabled={busy !== null}
        className="mt-6 text-vibe underline hover:text-vibe-bright disabled:opacity-60"
      >
        No thanks, please do not add this offer to my purchase
      </button>
    </div>
  );
}
