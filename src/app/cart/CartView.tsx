"use client";

import Image from "next/image";
import Link from "next/link";
import { shipping } from "@/config/offers";
import { cart, useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/catalog";
import { shippingFor } from "@/lib/shipping";

export function CartView() {
  const items = useCart();
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const shippingCost = shippingFor(items, subtotal);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-mute">Your cart is empty.</p>
        <Link href="/store" className="mt-6 inline-block bg-vibe px-6 py-3 font-display text-white hover:bg-vibe-bright">
          Browse the store
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <ul className="divide-y divide-line border-y border-line">
        {items.map((i) => (
          <li key={i.key} className="flex gap-4 py-5">
            <Link href={`/store/${i.slug}`} className="shrink-0">
              <Image src={i.image} alt="" width={96} height={96} className="size-24 object-cover" />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <Link href={`/store/${i.slug}`} className="font-display text-xl text-vibe hover:text-vibe-bright">
                  {i.title}
                </Link>
                {i.detail && <p className="text-mute">{i.detail}</p>}
                <p>{formatMoney(i.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-3">
                {i.max !== 1 && (
                  <label className="flex items-center gap-2">
                    <span className="sr-only">Quantity</span>
                    <input
                      type="number"
                      min={1}
                      max={i.max ?? 20}
                      value={i.qty}
                      onChange={(e) => cart.setQty(i.key, Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 border border-line bg-forest px-2 py-1 text-center"
                    />
                  </label>
                )}
                <button type="button" onClick={() => cart.remove(i.key)} className="text-mute underline hover:text-cream">
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <dl className="ml-auto mt-8 max-w-sm space-y-2">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatMoney(subtotal)}</dd>
        </div>
        <div className="flex justify-between text-mute">
          <dt>Shipping</dt>
          <dd>{shippingCost === 0 ? "Free" : formatMoney(shippingCost)}</dd>
        </div>
        {shippingCost > 0 && (
          <p className="text-sm text-mute">Free shipping on orders of {formatMoney(shipping.freeOver)} or more.</p>
        )}
        <div className="flex justify-between border-t border-line pt-2 text-xl">
          <dt>Total</dt>
          <dd>{formatMoney(subtotal + shippingCost)}</dd>
        </div>
      </dl>

      <div className="ml-auto mt-6 max-w-sm">
        <Link
          href="/checkout"
          className="block w-full bg-vibe px-6 py-4 text-center font-display text-xl text-white hover:bg-vibe-bright"
        >
          Checkout
        </Link>
        <p className="mt-3 text-center text-sm text-mute">Secure payment by Stripe</p>
      </div>
    </div>
  );
}
