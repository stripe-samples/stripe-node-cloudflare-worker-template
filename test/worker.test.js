import { env } from "cloudflare:workers";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import worker from "../src/index.js";

const paymentIntent = { id: "pi_worker_fixture", object: "payment_intent" };
// Keep whitespace: verification must use these exact bytes, not reserialized JSON.
const body = JSON.stringify({
  id: "evt_worker_fixture",
  object: "event",
  type: "payment_intent.created",
  data: { object: paymentIntent },
}, null, 2);

async function signedHeader(payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(env.STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC", key, encoder.encode(`${timestamp}.${payload}`),
  );
  const signature = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${signature}`;
}

async function request(path, options) {
  const ctx = createExecutionContext();
  const response = await worker.fetch(new Request(`https://worker.test${path}`, options), env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

let eventLog;

beforeEach(() => {
  // Mock only the network boundary; the actual SDK runs in workerd.
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected network request"));
  eventLog = vi.fn();
  vi.stubGlobal("console", { ...console, log: eventLog });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("creates the existing USD 20 T-shirt Checkout session and redirects with 303", async () => {
  let checkoutParams;
  const checkoutUrl = "https://checkout.stripe.com/c/pay/cs_test_worker_fixture";
  globalThis.fetch.mockImplementation(async (input, init) => {
    const outbound = new Request(input, init);
    expect(outbound.url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect(outbound.method).toBe("POST");
    expect(outbound.headers.get("authorization")).toBe(`Bearer ${env.STRIPE_API_KEY}`);
    checkoutParams = Object.fromEntries(new URLSearchParams(new TextDecoder().decode(await outbound.arrayBuffer())));
    return Response.json({ id: "cs_test_worker_fixture", object: "checkout.session", url: checkoutUrl });
  });

  const response = await request("/");
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe(checkoutUrl);
  expect(checkoutParams).toEqual({
    "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "T-shirt",
    "line_items[0][price_data][unit_amount]": "2000",
    "line_items[0][quantity]": "1",
    mode: "payment",
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
  });
});

it("verifies a signed raw webhook with Worker crypto before handling the event", async () => {
  const response = await request("/webhook", {
    method: "POST", body,
    headers: { "stripe-signature": await signedHeader(body) },
  });
  expect(response.status).toBe(200);
  expect(eventLog).toHaveBeenCalledWith(paymentIntent);
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it.each(["missing signature", "invalid signature", "tampered body"])(
  "rejects %s without verified-event processing", async (scenario) => {
    const headers = {};
    if (scenario === "invalid signature") {
      headers["stripe-signature"] = `t=${Math.floor(Date.now() / 1000)},v1=${"0".repeat(64)}`;
    } else if (scenario === "tampered body") {
      headers["stripe-signature"] = await signedHeader(body);
    }
    const response = await request("/webhook", {
      method: "POST", headers,
      body: scenario === "tampered body" ? `${body}\n` : body,
    });
    expect(response.status).toBe(400);
    expect(eventLog).not.toHaveBeenCalledWith(paymentIntent);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  },
);
