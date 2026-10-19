"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { site } from "@/config/offers";
import { useCart, useHydrated } from "@/lib/cart";
import { formatMoney } from "@/lib/catalog";
import type { CustomerInfo, OrderRequest, Quote } from "@/lib/orders";
import { US_STATES } from "@/lib/us-states";
import { StepLoading } from "@/components/CheckoutSteps";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Stripe's card field, styled to match the site.
const appearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#e61212",
    colorBackground: "#1c201c",
    colorText: "#f3f1ea",
    colorDanger: "#ff6b6b",
    fontFamily: "Newsreader, Georgia, serif",
    fontSizeBase: "17px",
    borderRadius: "0px",
  },
};
const fonts = [{ cssSrc: "https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&display=swap" }];

const money = (cents: number) => (cents === 0 ? "$0" : formatMoney(cents));
const input = "w-full border-2 border-line bg-forest px-4 py-3 placeholder:text-mute focus:border-vibe-bright focus:outline-none";

export function CheckoutView() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const cartItems = useCart();

  const order: OrderRequest = useMemo(
    () =>
      params.get("kind") === "funnel"
        ? {
            kind: "funnel",
            slug: params.get("slug") ?? "",
            format: params.get("format") ?? "",
            version: params.get("version") ?? undefined,
          }
        : {
            kind: "cart",
            items: cartItems.map(({ type, slug, format, version, qty }) =>
              type === "artwork" ? { type, slug, format: format!, version, qty } : { type, slug, qty },
            ),
          },
    [params, cartItems],
  );
  const orderKey = JSON.stringify(order);
  const cartEmpty = order.kind === "cart" && order.items.length === 0;

  // The summary is priced by the server; `result.key` tells which order it belongs to.
  const [result, setResult] = useState<{ key: string; quote?: Quote; error?: string }>();
  useEffect(() => {
    if (!hydrated || cartEmpty) return;
    let cancelled = false;
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: JSON.parse(orderKey) }),
    })
      .then((res) => res.json() as Promise<Quote & { error?: string }>)
      .then((data) => !cancelled && setResult({ key: orderKey, ...(data.error ? { error: data.error } : { quote: data }) }))
      .catch(() => !cancelled && setResult({ key: orderKey, error: "Couldn't load your order. Please try again." }));
    return () => {
      cancelled = true;
    };
  }, [hydrated, cartEmpty, orderKey]);

  if (!hydrated) return <StepLoading label="Loading checkout…" />;
  if (cartEmpty) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-mute">Your cart is empty.</p>
        <Link href="/store" className="mt-6 inline-block bg-vibe px-6 py-3 font-display text-white hover:bg-vibe-bright">
          Browse the store
        </Link>
      </div>
    );
  }
  if (result?.key !== orderKey) return <StepLoading label="Loading checkout…" />;
  if (result.error || !result.quote) {
    return <p className="px-4 py-24 text-center text-red-400" role="alert">{result.error}</p>;
  }

  const quote = result.quote;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
      <div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <p className="flex items-center gap-2 font-display text-xl">
            <ShieldIcon /> Secure checkout
          </p>
          <p className="text-sm uppercase tracking-widest text-mute">30-day refund guarantee</p>
        </div>
        {/* stripe={null} (no key yet) still renders the form, just without the card field. */}
        <Elements
          stripe={stripePromise}
          options={{ mode: "payment", amount: quote.total, currency: "usd", setupFutureUsage: "off_session", appearance, fonts }}
        >
          <CheckoutForm order={order} quote={quote} />
        </Elements>
      </div>
      <OrderSummary quote={quote} />
    </div>
  );
}

function CheckoutForm({ order, quote }: { order: OrderRequest; quote: Quote }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Reuse the payment after a declined card instead of creating a new one per attempt.
  const created = useRef<{ key: string; clientSecret: string }>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    const fail = (message?: string) => {
      setError(message || "Something went wrong. Please try again.");
      setBusy(false);
    };

    const form = new FormData(e.currentTarget);
    const customer = Object.fromEntries(
      ["name", "email", "line1", "city", "state", "postalCode"].map((k) => [k, String(form.get(k) ?? "")]),
    ) as CustomerInfo;

    const { error: fieldError } = await elements.submit();
    if (fieldError) return fail(fieldError.message);

    const key = JSON.stringify({ order, customer });
    if (created.current?.key !== key) {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, customer }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!data.clientSecret) return fail(data.error);
      created.current = { key, clientSecret: data.clientSecret };
    }

    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: created.current.clientSecret,
      confirmParams: {
        // Only used by payment methods that leave the page; Stripe appends ?payment_intent=...
        return_url: `${window.location.origin}/offer/stickers`,
        payment_method_data: { billing_details: { name: customer.name, email: customer.email } },
      },
      redirect: "if_required",
    });
    if (payError) return fail(payError.message);
    router.push(`/offer/stickers?payment_intent=${paymentIntent.id}`);
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-10">
      <fieldset className="space-y-4">
        <legend className="mb-4 font-display text-2xl">Contact information</legend>
        <input name="name" required autoComplete="name" placeholder="Your name" aria-label="Your name" className={input} />
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-label="Your email address"
          className={input}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-4 font-display text-2xl">Shipping address</legend>
        <input
          name="line1"
          required
          autoComplete="shipping address-line1"
          placeholder="Your street address"
          aria-label="Street address"
          className={input}
        />
        <input name="city" required autoComplete="shipping address-level2" placeholder="Your city" aria-label="City" className={input} />
        <div className="grid gap-4 sm:grid-cols-2">
          <select name="state" required defaultValue="" autoComplete="shipping address-level1" aria-label="State" className={input}>
            <option value="" disabled>
              Select your state
            </option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <input
            name="postalCode"
            required
            inputMode="numeric"
            pattern="\d{5}(-\d{4})?"
            autoComplete="shipping postal-code"
            placeholder="ZIP"
            aria-label="ZIP code"
            className={input}
          />
        </div>
        <p className="text-sm text-mute">Shipping to the United States only.</p>
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-display text-2xl">Shipping</legend>
        <div className="flex items-center justify-between border-2 border-vibe-bright bg-vibe/10 px-5 py-4">
          <span className="font-semibold">{quote.shipping === 0 ? "FREE insured US shipping" : "US shipping & handling"}</span>
          <span>{money(quote.shipping)}</span>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-display text-2xl">Billing information</legend>
        {stripePromise ? (
          <PaymentElement options={{ layout: "tabs" }} />
        ) : (
          <p className="border-2 border-sun/60 p-5" role="alert">
            Card payments aren&apos;t set up yet. Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{" "}
            <code>.env.local</code> (see README).
          </p>
        )}
      </fieldset>

      <div>
        <p className="text-center italic text-mute">Your art will arrive within 14 business days.</p>
        <button
          type="submit"
          disabled={busy || !stripe}
          className="mt-4 w-full bg-vibe px-6 py-5 font-display text-2xl uppercase text-white hover:bg-vibe-bright disabled:opacity-60"
        >
          {busy ? "Placing your order…" : `Place my order · ${money(quote.total)}`}
        </button>
        {error && (
          <p className="mt-3 text-center text-red-400" role="alert">
            {error}
          </p>
        )}
        <p className="mt-3 text-center text-sm text-mute">Payments are processed securely by Stripe.</p>
      </div>
    </form>
  );
}

function OrderSummary({ quote }: { quote: Quote }) {
  return (
    <aside className="h-fit space-y-8 bg-forest p-6 lg:sticky lg:top-24">
      <div>
        <h2 className="text-2xl">Order summary</h2>
        <ul className="mt-5 space-y-4">
          {quote.lines.map((l, i) => (
            <li key={i} className="flex items-center gap-4">
              {l.image && <Image src={l.image} alt="" width={64} height={64} className="size-16 shrink-0 object-cover" />}
              <span className="flex-1 leading-snug">
                {l.name}
                {l.qty > 1 && <span className="text-mute"> × {l.qty}</span>}
              </span>
            </li>
          ))}
        </ul>
        <ul className="mt-6 list-disc space-y-1 pl-5 text-mute">
          <li>Receive your order within 14 business days</li>
          <li>100% money back guarantee</li>
          <li>Frame not included</li>
        </ul>
      </div>

      <div>
        <h3 className="font-display text-xl">Total payment</h3>
        <dl className="mt-3">
          {quote.lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-4 border-b border-dashed border-line py-2">
              <dt className="text-mute">{l.name}</dt>
              <dd>{money(l.unitAmount * l.qty)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-b-2 border-cream py-2">
            <dt className="text-mute">Shipping</dt>
            <dd>{money(quote.shipping)}</dd>
          </div>
          <div className="flex justify-between pt-3 text-3xl">
            <dt className="font-display">Total</dt>
            <dd className="font-display">{money(quote.total)}</dd>
          </div>
        </dl>
        <p className="mt-1 text-right text-xs text-mute">All prices in USD</p>
      </div>

      <div className="border-2 border-line p-5 text-center">
        <p className="font-display text-sun">100% money-back guarantee</p>
        <p className="mt-3 text-sm leading-relaxed">
          Your purchase is backed by our 30-day unconditional money-back guarantee. If for any reason you&apos;re not
          100% satisfied with your purchase, just email{" "}
          <a href={`mailto:${site.email}`} className="underline">{site.email}</a> and I&apos;ll issue a refund within 24
          hours directly back to your original payment method.
        </p>
      </div>
    </aside>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 text-vibe" fill="currentColor" aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3Z" />
    </svg>
  );
}
