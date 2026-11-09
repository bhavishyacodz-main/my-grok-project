import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedRequestOrigin, parseAllowedOrigins } from "./origin-allowlist.ts";

test("parses a comma-separated list of exact origins", () => {
  const origins = parseAllowedOrigins("https://brandvika.example, https://preview.brandvika.example");
  assert.equal(origins.size, 2);
  assert.ok(origins.has("https://brandvika.example"));
});

test("rejects paths and wildcard patterns", () => {
  assert.throws(() => parseAllowedOrigins("https://brandvika.example/path"), /exact origins/);
  assert.throws(() => parseAllowedOrigins("https://*.brandvika.example"), /valid origin URLs|exact origins/);
});

test("rejects non-http protocols and malformed values", () => {
  assert.throws(() => parseAllowedOrigins("javascript:alert(1)"), /exact origins/);
  assert.throws(() => parseAllowedOrigins("not-a-url"), /valid origin URLs/);
});

test("allows only exact configured origins and local development origins", () => {
  const origins = parseAllowedOrigins("https://brandvika.example");
  assert.equal(isAllowedRequestOrigin("https://brandvika.example", origins), true);
  assert.equal(isAllowedRequestOrigin("https://other.example", origins), false);
  assert.equal(isAllowedRequestOrigin("https://brandvika.example.evil.test", origins), false);
  assert.equal(isAllowedRequestOrigin("http://localhost:8080", origins), true);
  assert.equal(isAllowedRequestOrigin(null, origins), false);
});
