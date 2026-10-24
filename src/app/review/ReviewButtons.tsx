"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Takes an add-on back out of the order. For version prints, `keep` lists the other picked prints
 * to keep, so only this one is removed.
 */
export function RemoveOfferButton({ order, offer, keep }: { order: string; offer: "version" | "stickers"; keep?: number[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keep?.length ? { order, offer, accept: true, picks: keep } : { order, offer, accept: false }),
    });
    const data = (await res.json()) as { order?: string; error?: string };
    if (!data.order) {
      setError(data.error ?? "Couldn't remove it.");
      setBusy(false);
      return;
    }
    router.replace(`/review?order=${encodeURIComponent(data.order)}`);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={remove} disabled={busy} className="text-sm text-vibe-bright underline hover:text-cream disabled:opacity-50">
        {busy ? "Removing…" : "Remove"}
      </button>
      {error && <span className="block text-sm text-red-400">{error}</span>}
    </>
  );
}

/** Charges the saved card for the order total, handling a card authentication step if the bank asks. */
export function SubmitOrderButton({ order, label }: { order: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    const fail = (msg?: string) => {
      setError(msg || "We couldn't complete your payment. Please try again.");
      setBusy(false);
    };
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    const data = (await res.json()) as {
      status?: "paid" | "requires_action";
      paymentIntent?: string;
      clientSecret?: string;
      error?: string;
    };
    if (data.error || !data.paymentIntent) return fail(data.error);
    if (data.status === "requires_action") {
      const stripe = publishableKey ? await loadStripe(publishableKey) : null;
      if (!stripe || !data.clientSecret) return fail("Your bank needs to confirm this payment, but card payments aren't set up.");
      const { error } = await stripe.handleNextAction({ clientSecret: data.clientSecret });
      if (error) return fail(error.message);
    }
    router.push(`/thank-you?payment_intent=${encodeURIComponent(data.paymentIntent)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="w-full bg-vibe px-6 py-5 font-display text-2xl uppercase text-white hover:bg-vibe-bright disabled:opacity-60"
      >
        {busy ? "Processing payment…" : label}
      </button>
      {error && (
        <p className="mt-3 text-center text-red-400" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-center text-sm text-mute">Your card is charged when you submit. Payments are secured by Stripe.</p>
    </>
  );
}
