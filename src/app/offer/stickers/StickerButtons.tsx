"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StickerButtons({ paymentIntent, acceptLabel }: { paymentIntent: string; acceptLabel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; next: string } | null>(null);
  const declineHref = `/thank-you?payment_intent=${encodeURIComponent(paymentIntent)}`;

  async function accept() {
    setBusy(true);
    const res = await fetch("/api/upsell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntent }),
    });
    const data = (await res.json()) as { next: string; error?: string };
    if (data.error) {
      setError({ message: data.error, next: data.next });
      setBusy(false);
    } else {
      router.push(data.next);
    }
  }

  if (error) {
    return (
      <div className="text-center" role="alert">
        <p className="text-red-400">We couldn&apos;t add the sticker pack: {error.message}</p>
        <a href={error.next} className="mt-4 inline-block underline">
          Continue — your original order is confirmed
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={accept}
        disabled={busy}
        className="w-full max-w-md bg-sun px-8 py-4 font-display text-2xl uppercase text-ink hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Adding to your order…" : acceptLabel}
      </button>
      <p className="mt-2 text-sm text-mute">Charged to the card you just used. No need to re-enter anything.</p>
      <a href={declineHref} className="mt-6 inline-block text-vibe underline hover:text-vibe-bright">
        No thanks, please do not add this offer to my purchase
      </a>
    </div>
  );
}
