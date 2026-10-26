import { after } from "next/server";
import Stripe from "stripe";
import { OrderError, submitOrder } from "@/lib/orders";
import { sendReceipt } from "@/lib/receipt-email";

/** Charges the card saved at checkout, once, for the final total on the review page. */
export async function POST(request: Request) {
  const origin = process.env.SITE_URL ?? new URL(request.url).origin;
  try {
    const { order } = (await request.json()) as { order: string };
    const result = await submitOrder(order, origin);
    // Cards that need an extra check are confirmed in the browser; the thank-you page sends those receipts.
    if (result.status === "paid") after(() => sendReceipt(result.paymentIntent));
    return Response.json(result);
  } catch (err) {
    if (err instanceof OrderError) return Response.json({ error: err.message }, { status: 400 });
    if (err instanceof Stripe.errors.StripeCardError) {
      return Response.json({ error: err.message ?? "Your card was declined." }, { status: 402 });
    }
    console.error(err);
    return Response.json({ error: "We couldn't complete your payment. Please try again." }, { status: 500 });
  }
}
