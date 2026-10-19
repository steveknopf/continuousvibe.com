"use client";

import { useSyncExternalStore } from "react";

/** A cart line plus a snapshot of what to display. Prices are re-checked on the server at checkout. */
export type CartItem = {
  key: string;
  type: "artwork" | "product";
  slug: string;
  format?: string;
  version?: string;
  qty: number;
  title: string;
  detail?: string;
  unitPrice: number;
  image: string;
  /** Max quantity (originals = 1, limited stock items = stock). */
  max?: number;
};

const STORAGE_KEY = "cv-cart";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: CartItem[] | undefined;

function read(): CartItem[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartItem[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode): the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

const noopSubscribe = () => () => {};

/** False during server render and hydration, true once the browser (and the saved cart) is available. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export const cart = {
  add(item: Omit<CartItem, "key" | "qty">, qty = 1) {
    const key = [item.type, item.slug, item.format, item.version].filter(Boolean).join(":");
    const items = read();
    const existing = items.find((i) => i.key === key);
    if (existing) {
      cart.setQty(key, existing.qty + qty);
    } else {
      write([...items, { ...item, key, qty: Math.min(qty, item.max ?? qty) }]);
    }
  },
  setQty(key: string, qty: number) {
    write(
      read()
        .map((i) => (i.key === key ? { ...i, qty: Math.min(qty, i.max ?? qty) } : i))
        .filter((i) => i.qty > 0),
    );
  },
  remove(key: string) {
    write(read().filter((i) => i.key !== key));
  },
  clear() {
    write([]);
  },
};
