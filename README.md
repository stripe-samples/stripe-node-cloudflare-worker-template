# `stripe-node` Cloudflare Worker Template
This is a template for setting up a [Cloudflare Worker](https://workers.cloudflare.com/) which uses [`stripe-node`](https://github.com/stripe/stripe-node). The [`wrangler`](https://developers.cloudflare.com/workers/cli-wrangler) CLI tool is used for publishing.

## Generating

To generate using [wrangler](https://github.com/cloudflare/wrangler2)

```
wrangler generate projectname https://github.com/stripe-samples/stripe-node-cloudflare-worker-template
```

Further documentation for Wrangler can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler).

## Publishing

To add your STRIPE_API_KEY as a plaintext environment variable via wrangler:

```toml
[vars]
STRIPE_API_KEY = "<YOUR API KEY HERE>"
```

Now, you can build and publish your worker using:

```bash
wrangler publish
```

This will build your application and publish it. If this is your first time publishing, it will create a new worker named `my-stripe-worker` under your account. If all goes well, the command will output a URL that looks something like `https://my-stripe-worker.<your user name>.workers.dev` where your worker is available.

### Cloudflare Secrets

Cloudflare Workers offer a [secrets infrastructure](https://developers.cloudflare.com/workers/platform/environment-variables#add-secrets-to-your-project) for storing an encrypted secret. You can use this instead of relying on an environment variable.

1. Publish your worker at least once using the above instructions to bootstrap the worker.
2. Run `wrangler secret put STRIPE_API_KEY`. This will prompt you to enter your secret (ie. your Stripe API key). 

This only needs to be done the first time you are configuring up your new worker. It will persist across deployments. Once set up, you can publish using:

```bash
wrangler publish
```