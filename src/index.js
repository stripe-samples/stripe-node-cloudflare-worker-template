const { Hono } = require("hono");
const { env } = require("hono/adapter");
const Stripe = require("stripe");
const app = new Hono();

/**
 * Setup Stripe SDK prior to handling a request
 */
app.use('*', async (context, next) => {
  // Load the Stripe API key from context.
  const { STRIPE_API_KEY: stripeKey } = env(context);

  // Instantiate the Stripe client object 
  const stripe = new Stripe(stripeKey, {
    appInfo: {
      // For sample support and debugging, not required for production:
      name: "stripe-samples/stripe-node-cloudflare-worker-template",
      version: "0.0.1",
      url: "https://github.com/stripe-samples"
    },
    maxNetworkRetries: 3,
    timeout: 30 * 1000,
  });

  // Set the Stripe client to the Variable context object
  context.set("stripe", stripe);

  await next();
});


app.get("/", async (context) => {
  /**
   * Load the Stripe client from the context
   */
  const stripe = context.get('stripe');
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
    /**
     * Load the Stripe client from the context
     */
    const stripe = context.get('stripe');
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
