import Link from "next/link";
import { site } from "@/config/offers";

const STEPS = ["Checkout", "Add-ons", "Review & pay", "Complete"];

/** The step bar across the top of the checkout, offer, review and success pages. */
export function CheckoutSteps({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="bg-forest px-4 py-4">
      <ol className="mx-auto flex max-w-3xl overflow-hidden rounded-full border border-line text-center text-xs sm:text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i + 1 === step ? "step" : undefined}
            className={`flex-1 px-2 py-2 ${i + 1 === step ? "bg-vibe text-white" : i + 1 < step ? "text-cream" : "text-mute"}`}
          >
            <span className="hidden sm:inline">Step {i + 1}: </span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The order id from an offer or review page URL (`?order=`, or `?setup_intent=` after a bank redirect). */
export function orderParam(params: Record<string, string | string[] | undefined>) {
  const v = params.order ?? params.setup_intent;
  return typeof v === "string" ? v : undefined;
}

export function OrderNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl text-vibe">We couldn&apos;t find your order</h1>
      <p className="mt-4 text-mute">
        Nothing has been charged. Please check out again, or email{" "}
        <a href={`mailto:${site.email}`} className="underline">{site.email}</a> if you need a hand.
      </p>
      <Link href="/" className="mt-8 inline-block underline">Back to the homepage</Link>
    </div>
  );
}

export function StepLoading({ label = "Loading your order…" }: { label?: string }) {
  return <p className="py-24 text-center text-mute">{label}</p>;
}
