import assert from "node:assert/strict";
import test from "node:test";
import { getAuthCallbackError } from "./callback-error.ts";

test("returns null when the callback has no provider error", () => {
  assert.equal(getAuthCallbackError(new URLSearchParams("code=abc")), null);
});

test("shows the provider error description so redirect problems are diagnosable", () => {
  assert.equal(
    getAuthCallbackError(new URLSearchParams("error=redirect_uri_mismatch&error_description=Invalid+redirect+URI")),
    "Sign-in was not completed: Invalid redirect URI",
  );
});

test("falls back to the provider error code when no description is supplied", () => {
  assert.match(
    getAuthCallbackError(new URLSearchParams("error=access_denied")),
    /access_denied/,
  );
});

test("limits and removes control characters from provider descriptions", () => {
  const result = getAuthCallbackError(new URLSearchParams(`error_description=${encodeURIComponent("bad\\n" + "x".repeat(300))}`));
  assert.ok(result);
  assert.equal(result.length, 240 + "Sign-in was not completed: ".length);
  assert.ok(!result.includes("\\n"));
});
