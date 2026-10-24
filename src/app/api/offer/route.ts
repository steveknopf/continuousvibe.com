import { OrderError, setOffer, type Offer } from "@/lib/orders";

/** Records yes or no to an offer after checkout. Nothing is charged until the review page. */
export async function POST(request: Request) {
  const { order, offer, accept, picks } = (await request.json()) as { order: string; offer: Offer; accept: boolean; picks?: number[] };
  if (offer !== "version" && offer !== "stickers") return Response.json({ error: "Unknown offer." }, { status: 400 });
  try {
    return Response.json({ order: await setOffer(order, offer, accept === true, Array.isArray(picks) ? picks.map(Number) : undefined) });
  } catch (err) {
    if (err instanceof OrderError) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Something went wrong updating your order." }, { status: 500 });
  }
}
