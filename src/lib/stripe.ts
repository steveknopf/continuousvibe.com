import "server-only";
import Stripe from "stripe";

let client: Stripe | undefined;

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local (see README).");
  client ??= new Stripe(key);
  return client;
}
