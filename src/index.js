const { Hono } = require("hono");
const Stripe = require("stripe");
const app = new Hono();

function createStripeClient(apiKey) {
  return new Stripe(apiKey, {
    httpClient: Stripe.createFetchHttpClient(),
    appInfo: { // For sample support and debugging, not required for production:
      name: "stripe-samples/stripe-node-cloudflare-worker-template",
      version: "0.0.1",
      url: "https://github.com/stripe-samples"
    }
  });
}

app.get("/", async (context) => {
  const stripe = createStripeClient(context.env.STRIPE_API_KEY);
  /*
   * Sample checkout integration which redirects a customer to a checkout page
   * for the specified line items.
   *
   * See https://stripe.com/docs/payments/accept-a-payment?integration=checkout.
   */
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "T-shirt",
          },
          unit_amount: 2000,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
  });
  return context.redirect(session.url, 303);
});

app.post("/webhook", async (context) => {
    const stripe = createStripeClient(context.env.STRIPE_API_KEY);
    const signature = context.req.raw.headers.get("stripe-signature");
    try {
        if (!signature) {
            return context.text("", 400);
        }
        const body = await context.req.text();
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            context.env.STRIPE_WEBHOOK_SECRET,
            undefined,
            Stripe.createSubtleCryptoProvider()
        );
        switch(event.type) {
            case "payment_intent.created": {
                console.log(event.data.object)
                break
            }
            default:
                break
        }
        return context.text("", 200);
      } catch (err) {
        const errorMessage = `⚠️  Webhook signature verification failed. ${err instanceof Error ? err.message : "Internal server error"}`
        console.log(errorMessage);
        return context.text(errorMessage, 400);
      }
})

export default app;
