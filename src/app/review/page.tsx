import type { Metadata } from "next";
import { Suspense } from "react";
import { formatMoney } from "@/lib/catalog";
import { finalLines, getOrder } from "@/lib/orders";
import { CheckoutSteps, orderParam, OrderNotFound, StepLoading } from "@/components/CheckoutSteps";
import { RemoveOfferButton, SubmitOrderButton } from "./ReviewButtons";

// Checkout step 3: review the order with any add-ons, remove what you don't want, then pay.
// This is the only place the card is charged.

export const metadata: Metadata = { title: "Review your order", robots: { index: false } };

const money = (cents: number) => (cents === 0 ? "Free" : formatMoney(cents));

export default function ReviewPage({ searchParams }: PageProps<"/review">) {
  return (
    <>
      <CheckoutSteps step={3} />
      <Suspense fallback={<StepLoading />}>
        <Review searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Review({ searchParams }: Pick<PageProps<"/review">, "searchParams">) {
  const order = await getOrder(orderParam(await searchParams));
  if (!order) return <OrderNotFound />;
  const { lines, total } = finalLines(order);
  const ship = order.shipping;

  return (
    <div className="px-4 pb-16 pt-10 sm:px-8">
      <h1 className="text-center text-4xl text-vibe sm:text-5xl">Review your order</h1>
      <p className="mt-3 text-center text-mute">Your card hasn&apos;t been charged yet. Remove anything you don&apos;t want, then submit.</p>

      <div className="mx-auto mt-10 max-w-2xl bg-forest px-6 py-8 sm:px-10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-mute">
              <th className="pb-3 font-normal">Item</th>
              <th className="pb-3 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-4 pr-4">
                  <span className="font-semibold">{l.name}</span>
                  {l.qty > 1 && <span className="block text-sm text-mute">Qty {l.qty}</span>}
                  {l.added && <span className="block text-sm text-sun">Add-on</span>}
                </td>
                <td className="py-4 text-right align-top">
                  <span className="font-semibold">{formatMoney(l.unitAmount * l.qty)}</span>
                  {l.offer && (
                    <span className="mt-1 block">
                      <RemoveOfferButton
                        order={order.id}
                        offer={l.offer}
                        keep={l.offer === "version" ? order.accepted.version.filter((p) => p !== l.pick) : undefined}
                      />
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-b border-line text-mute">
              <td className="py-4">Shipping</td>
              <td className="py-4 text-right">{money(order.shippingCost)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 text-right font-semibold">Total:</td>
              <td className="pt-4 text-right text-2xl font-semibold">{formatMoney(total)}</td>
            </tr>
          </tfoot>
        </table>

        {ship && (
          <p className="mt-8 text-sm text-mute">
            Shipping to {ship.name}, {[ship.line1, ship.city, ship.state, ship.postalCode].filter(Boolean).join(", ")}
            {order.email && <> · Receipt to {order.email}</>}
          </p>
        )}

        <div className="mt-8">
          <SubmitOrderButton order={order.id} label={`Submit order · ${formatMoney(total)}`} />
        </div>
      </div>
    </div>
  );
}
