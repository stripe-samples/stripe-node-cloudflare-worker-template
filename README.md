# `stripe-node` Cloudflare Worker Template

A small [Cloudflare Worker](https://workers.cloudflare.com/) using
[`stripe-node`](https://github.com/stripe/stripe-node) and Hono. `GET /` creates a
Checkout session for one USD 20 T-shirt and redirects to Stripe-hosted Checkout
with HTTP 303. `POST /webhook` verifies the raw request body asynchronously before
logging `payment_intent.created` events.

## Setup

Use **Node.js 24 LTS** and npm (the same Node major used in CI). Clone this
repository, or fork it for your own application:

```sh
git clone https://github.com/stripe-samples/stripe-node-cloudflare-worker-template.git
cd stripe-node-cloudflare-worker-template
npm ci
cp .dev.vars.example .dev.vars
```

For your own copy, change `name` and `author` in `package.json`, and choose a unique
Worker `name` in `wrangler.toml`. If you change the package metadata, run
`npm install --package-lock-only` to update the lockfile. The sample remains MIT
licensed.

Edit the ignored `.dev.vars` file to supply both bindings:

```dotenv
STRIPE_API_KEY='sk_test_xxx'
STRIPE_WEBHOOK_SECRET='whsec_xxx'
```

Find your **test-mode** secret API key in the
[Stripe Dashboard](https://dashboard.stripe.com/test/apikeys). Replace the webhook
placeholder with the Stripe CLI listener's signing secret for local testing.
Keep `.dev.vars` local; never commit keys or put them in `wrangler.toml`, logs,
screenshots, or pull requests.

```sh
npm run dev
```

Open the URL printed by Wrangler (normally `http://localhost:8787`) to create the
Checkout session and follow the redirect. Use Stripe's test card
`4242 4242 4242 4242` with a future expiry and any CVC. The success and cancellation
URLs in `src/index.js` point to `example.com`; replace them for your application.

### Exercise the webhook locally

Install and authenticate the [Stripe CLI](https://docs.stripe.com/stripe-cli).
Use the actual port printed by Wrangler:

```sh
stripe listen --forward-to http://localhost:8787/webhook
```

Copy the listener's `whsec_…` value into `STRIPE_WEBHOOK_SECRET` in `.dev.vars`,
then restart `npm run dev`. In another terminal:

```sh
stripe trigger payment_intent.created
```

The listener should report HTTP 200, and the Worker should log the verified
PaymentIntent. To check rejection, temporarily use a wrong signing secret in
`.dev.vars`, restart the Worker, and trigger again: delivery should return 400.
Restore the listener secret afterwards.

## Deploy

Choose a unique Worker name in `wrangler.toml`. With your Cloudflare account
credentials, bootstrap the Worker, add both encrypted secrets, and deploy again:

```sh
npx wrangler login
npm run deploy
npx wrangler secret put STRIPE_API_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npm run deploy
```

The first deployment creates the Worker but it cannot serve the sample routes
until its secrets are configured. Enter a **test-mode** API key at the secret
prompt. Create a test-mode webhook endpoint for the deployed Worker URL plus
`/webhook` in the [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks),
subscribe to `payment_intent.created`, and enter **that endpoint's signing
secret** at the `STRIPE_WEBHOOK_SECRET` prompt. It differs from the temporary
local Stripe CLI listener secret. Secrets persist across deployments; `.dev.vars`
is only used locally. Do not publish keys as plaintext `[vars]` bindings.

Request API versioning comes from the installed Stripe SDK's bundled API-version
pin; this sample intentionally omits an `apiVersion` override. Webhook endpoint
event versions are configured separately in Stripe. Review the
[Stripe API changelog](https://docs.stripe.com/changelog) when upgrading the SDK
or changing an endpoint's event version.

## Check changes

```sh
npm ci
npm test
npm run deploy -- --dry-run
npm audit
```

The five regression checks run in Cloudflare's Worker runtime. Checkout mocks only
outbound Fetch, and webhook tests use actual Web Crypto for a valid signature,
missing signature, invalid signature, and a modified body. CI uses read-only
permissions and requires no Stripe or Cloudflare credentials. Dry-run bundling
does not publish; real Checkout, CLI delivery, and hosted deployment need separate
manual verification with test credentials.

If local startup fails, use Wrangler's diagnostic output and current
[Cloudflare troubleshooting guidance](https://developers.cloudflare.com/workers/observability/dev-tools/)
to check your supported Node version, network, and trusted CA configuration.

## Maintenance and contact

The owning team is **Stripe developer-sdks**. Report sample bugs and proposed
changes through this repository's issues and pull requests. For security reports,
use [Stripe's vulnerability disclosure program](https://stripe.com/docs/security/stripe#disclosure-and-reward-program)
as described in the organization's
[security policy](https://github.com/stripe-samples/.github/blob/master/SECURITY.md).

The ownership handoff is in progress: review routing, the named maintenance DRI,
and ongoing triage coverage still need confirmation. Dependency updates should
retain the SDK's bundled API version, review major-version migration notes, and
pass the Worker checks above.
