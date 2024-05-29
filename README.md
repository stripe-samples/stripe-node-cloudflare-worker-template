# `stripe-node` Cloudflare Worker Template
This is a template for setting up a [Cloudflare Worker](https://workers.cloudflare.com/) which uses [`stripe-node`](https://github.com/stripe/stripe-node). The [`wrangler`](https://developers.cloudflare.com/workers/cli-wrangler) CLI tool is used for publishing.

## Generating

To generate using [wrangler](https://github.com/cloudflare/wrangler2)

```
wrangler generate projectname https://github.com/stripe-samples/stripe-node-cloudflare-worker-template
cd projectname
npm install
```

Further documentation for Wrangler can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler).

## How to run locally

To add your STRIPE_API_KEY as a plaintext environment variable via wrangler:

Rename and move the `.dev.vars.example` file into a file named `.dev.vars`. For example:

```toml
cp .dev.vars.example .dev.vars
```

Example .env file:

```
STRIPE_API_KEY='sk_test_xxx'
```

You will need a Stripe account in order to run the demo. Once you set up your account, go to the Stripe [developer dashboard](https://stripe.com/docs/development#api-keys) to find your API keys.

Finally, you can run this example by the following command:

```
npm run dev
```

You will get the local application URL like the following:

```bash
[mf:inf] Ready on http://0.0.0.0:51219 
[mf:inf] - http://127.0.0.1:51219
[mf:inf] - http://192.168.86.21:51219
[mf:inf] - http://172.18.96.89:51219
```

### [Optional] Run a webhook locally

You can use the Stripe CLI to easily spin up a local webhook.

First install the CLI and link your Stripe account.

```
stripe listen --forward-to http://{REPLACE_TO_YOUR_LOCAL_APPLICATION_URL}/webhook
```

The CLI will print a webhook secret key to the console. Set STRIPE_WEBHOOK_SECRET to this value in your .env file.

You should see events logged in the console where the CLI is running.

When you are ready to create a live webhook endpoint, follow our guide in the docs on [configuring a webhook endpoint in the dashboard](https://stripe.com/docs/webhooks/setup#configure-webhook-settings).

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

## Troubleshooting

### **MiniflareCoreError [ERR_RUNTIME_FAILURE]: The Workers runtime failed to start. There is likely additional logging output above.**

Depending on the settings of your local machine, there may be failures when attempting to start the service in a local environment using Wrangler. According to a [GitHub issue](https://github.com/cloudflare/workers-sdk/issues/4709#issuecomment-1988694586), it could be related to the certificate file or network settings.

To avoid using an invalid certificate file, please try starting the application with the following command:

```bash
NODE_EXTRA_CA_CERTS="" npm run dev
```

If it still does not work, you may need to change the `/etc/hosts/` file and add the following settings:

```
127.0.0.1       localhost
```