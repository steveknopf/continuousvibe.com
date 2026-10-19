import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <h1 className="text-5xl text-vibe">Cart</h1>
      <CartView />
    </div>
  );
}
