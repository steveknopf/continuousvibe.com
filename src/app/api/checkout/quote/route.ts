import { OrderError, quote, type OrderRequest } from "@/lib/orders";

/** Prices an order for the checkout page's summary. */
export async function POST(request: Request) {
  try {
    const { order } = (await request.json()) as { order: OrderRequest };
    return Response.json(quote(order));
  } catch (err) {
    if (err instanceof OrderError) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Couldn't load your order. Please try again." }, { status: 500 });
  }
}
