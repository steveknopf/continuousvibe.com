import { createPayment, OrderError, type CustomerInfo, type OrderRequest } from "@/lib/orders";

/** Creates the payment for the checkout form; the browser confirms it with the card details. */
export async function POST(request: Request) {
  try {
    const { order, customer } = (await request.json()) as { order: OrderRequest; customer: CustomerInfo };
    return Response.json({ clientSecret: await createPayment(order, customer) });
  } catch (err) {
    if (err instanceof OrderError) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Checkout is unavailable right now. Please try again." }, { status: 500 });
  }
}
