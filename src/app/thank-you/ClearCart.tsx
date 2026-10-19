"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";

/** Empties the cart once a store order is paid. */
export function ClearCart() {
  useEffect(() => cart.clear(), []);
  return null;
}
