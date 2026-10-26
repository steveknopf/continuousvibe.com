import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { Suspense } from "react";
import { formatMoney } from "@/lib/catalog";
import { getReceipt } from "@/lib/orders";
import { sendReceipt } from "@/lib/receipt-email";
import { CheckoutSteps, OrderNotFound, StepLoading } from "@/components/CheckoutSteps";
import { CheckIcon } from "@/components/Icons";
import { ClearCart } from "./ClearCart";

// Checkout step 4: order success with the receipt of everything that was charged.

export const metadata: Metadata = { title: "Thank you for your order!", robots: { index: false } };

const money = (cents: number) => (cents === 0 ? "$0.00" : formatMoney(cents));

export default function ThankYouPage({ searchParams }: PageProps<"/thank-you">) {
  return (
    <>
      <CheckoutSteps step={4} />
      <Suspense fallback={<StepLoading />}>
        <ThankYou searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ThankYou({ searchParams }: Pick<PageProps<"/thank-you">, "searchParams">) {
  const { payment_intent } = await searchParams;
  const order = await getReceipt(typeof payment_intent === "string" ? payment_intent : undefined);
  if (!order) return <OrderNotFound />;
  // Usually already sent when the card was charged; this catches payments confirmed in the browser.
  if (!order.receiptSent) after(() => sendReceipt(order.id));

  const shippingCost = order.shippingCost;
  const rows = order.lines.map((l) => ({
    name: l.name,
    detail: [l.qty > 1 ? `Qty ${l.qty}` : "", l.added ? "Add-on" : ""].filter(Boolean).join(" · ") || undefined,
    amount: l.unitAmount * l.qty,
  }));
  const total = order.total;
  const ship = order.shipping;

  return (
    <div className="px-4 pb-16 pt-10 sm:px-8">
      {order.kind === "cart" && <ClearCart />}
      <h1 className="text-center text-4xl text-vibe sm:text-5xl">Thank you for your order!</h1>

      <div className="mx-auto mt-10 max-w-2xl bg-forest px-6 py-10 sm:px-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-vibe">
          <CheckIcon className="size-9 text-white" />
        </div>
        <div className="mt-8 space-y-4 text-center leading-relaxed">
          <p>
            I&apos;ve just sent your order confirmation to <strong>{order.email}</strong>. Please check it out
            (you may need to check your spam/promo folders).
          </p>
          <p>I will start working on getting your order out to you right away.</p>
          <p>Please allow up to 14 business days for it to arrive.</p>
        </div>

        <table className="mt-10 w-full text-left">
          <thead>
            <tr className="border-b border-line text-mute">
              <th className="pb-3 font-normal">Description</th>
              <th className="pb-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-4 pr-4">
                  <span className="font-semibold">{r.name}</span>
                  {r.detail && <span className="block text-sm text-mute">{r.detail}</span>}
                </td>
                <td className="py-4 text-right font-semibold">{money(r.amount)}</td>
              </tr>
            ))}
            <tr className="border-b border-line text-mute">
              <td className="py-4">Shipping</td>
              <td className="py-4 text-right">{shippingCost === 0 ? "Free" : money(shippingCost)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 text-right font-semibold">Total:</td>
              <td className="pt-4 text-right text-xl font-semibold">{money(total)}</td>
            </tr>
          </tfoot>
        </table>

        {ship && (
          <p className="mt-8 text-sm text-mute">
            Shipping to {ship.name}, {[ship.line1, ship.city, ship.state, ship.postalCode].filter(Boolean).join(", ")}
          </p>
        )}

        <Link href="/store" className="mt-8 block bg-vibe py-4 text-center font-display text-lg text-white hover:bg-vibe-bright">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
