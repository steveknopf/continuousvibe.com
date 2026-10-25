import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSteps, StepLoading } from "@/components/CheckoutSteps";
import { CheckoutView } from "./CheckoutView";

// Checkout step 1 for both the store cart (/checkout) and the funnel's Daylight + Blacklight
// print pair (/checkout?kind=funnel&slug=...&format=...).

export const metadata: Metadata = { title: "Secure checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <CheckoutSteps step={1} />
      <Suspense fallback={<StepLoading label="Loading checkout…" />}>
        <CheckoutView />
      </Suspense>
    </>
  );
}
