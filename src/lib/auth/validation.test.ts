import assert from "node:assert/strict";
import test from "node:test";
import { validateEmployerCredentials } from "./validation.ts";

test("normalizes employer email addresses", () => {
  assert.deepEqual(
    validateEmployerCredentials("  EMPLOYER@Example.com ", "safe-pass-123", "signin"),
    { ok: true, email: "employer@example.com" },
  );
});

test("rejects malformed email addresses", () => {
  assert.deepEqual(
    validateEmployerCredentials("not-an-email", "safe-pass-123", "signin"),
    { ok: false, message: "Enter a valid email address." },
  );
});

test("requires a password", () => {
  assert.deepEqual(
    validateEmployerCredentials("employer@example.com", "", "signin"),
    { ok: false, message: "Enter your password." },
  );
});

test("requires at least eight characters at employer registration", () => {
  assert.deepEqual(
    validateEmployerCredentials("employer@example.com", "short", "signup"),
    { ok: false, message: "Use a password with at least 8 characters." },
  );
});

test("accepts a valid employer registration", () => {
  assert.deepEqual(
    validateEmployerCredentials("employer@example.com", "long-enough-password", "signup"),
    { ok: true, email: "employer@example.com" },
  );
});
