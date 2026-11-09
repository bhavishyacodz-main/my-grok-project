import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_CALLBACK_PATH, getAuthRedirectUrl, PASSWORD_RESET_PATH } from "./redirects.ts";

test("Google OAuth returns to the current Vercel preview origin", () => {
  assert.equal(getAuthRedirectUrl("https://my-grok-project-preview.vercel.app", AUTH_CALLBACK_PATH), "https://my-grok-project-preview.vercel.app/auth/callback");
});

test("Google OAuth returns to the local Vite origin on port 8080", () => {
  assert.equal(getAuthRedirectUrl("http://localhost:8080", AUTH_CALLBACK_PATH), "http://localhost:8080/auth/callback");
});

test("password recovery returns to the same deployment", () => {
  assert.equal(getAuthRedirectUrl("https://brandvika.example", PASSWORD_RESET_PATH), "https://brandvika.example/reset-password");
});

test("rejects cross-origin callback targets", () => {
  assert.throws(() => getAuthRedirectUrl("https://brandvika.example", "https://attacker.example/callback"), /must stay on the current site/);
});
