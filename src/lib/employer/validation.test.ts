import assert from "node:assert/strict";
import test from "node:test";
import { validateEmployerProfile } from "./validation.ts";

const valid = {
  employerType: "business" as const,
  displayName: "Acme Studio",
  city: "Pune",
  region: "Maharashtra",
  contactEmail: "hello@example.com",
};

test("normalizes profile fields", () => {
  assert.deepEqual(
    validateEmployerProfile({ ...valid, displayName: " Acme Studio ", contactEmail: " HELLO@Example.com " }),
    { ok: true, value: valid },
  );
});

test("rejects short display names", () => {
  assert.deepEqual(
    validateEmployerProfile({ ...valid, displayName: "A" }),
    { ok: false, message: "Enter a name between 2 and 120 characters." },
  );
});

test("rejects malformed contact emails", () => {
  assert.deepEqual(
    validateEmployerProfile({ ...valid, contactEmail: "not-an-email" }),
    { ok: false, message: "Enter a valid contact email address." },
  );
});

test("rejects invalid employer types", () => {
  assert.deepEqual(
    validateEmployerProfile({ ...valid, employerType: "unknown" as "business" }),
    { ok: false, message: "Choose an individual or business profile." },
  );
});
