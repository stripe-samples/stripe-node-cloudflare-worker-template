import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        bindings: {
          STRIPE_API_KEY: "sk_test_worker_fixture",
          STRIPE_WEBHOOK_SECRET: "whsec_worker_fixture",
        },
      },
    }),
  ],
});
