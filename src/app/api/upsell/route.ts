import Stripe from "stripe";
import { acceptStickerPack, isPreview, OrderError } from "@/lib/orders";

export async function POST(request: Request) {
  const { paymentIntent } = (await request.json()) as { paymentIntent: string };
  // Local preview: pretend the sticker pack was added, without charging anything.
  if (isPreview(paymentIntent)) return Response.json({ next: "/thank-you?payment_intent=preview-stickers" });
  const next = `/thank-you?payment_intent=${encodeURIComponent(paymentIntent)}`;
  try {
    await acceptStickerPack(paymentIntent);
    return Response.json({ next });
  } catch (err) {
    // Card declined or needs authentication: tell the buyer, but let them carry on.
    if (err instanceof OrderError || err instanceof Stripe.errors.StripeCardError) {
      return Response.json({ error: err.message, next }, { status: 400 });
    }
    console.error(err);
    return Response.json({ error: "Something went wrong adding this to your order.", next }, { status: 500 });
  }
}
