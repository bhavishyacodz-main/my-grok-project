import assert from "node:assert/strict";
import test from "node:test";
import { validateJobDraft, type JobDraftInput } from "./validation.ts";

const valid: JobDraftInput = {
  title: "Customer Support Associate",
  category: "Customer service",
  description: "Help customers with product questions and coordinate helpful solutions with the team.",
  location: "Pune, Maharashtra",
  employmentType: "full-time",
  workMode: "hybrid",
};

test("trims and accepts a valid draft", () => {
  const result = validateJobDraft({ ...valid, title: " Customer Support Associate " });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.title, valid.title);
});

test("rejects short job titles", () => {
  assert.deepEqual(validateJobDraft({ ...valid, title: "Hi" }), {
    ok: false,
    message: "Job title must be between 5 and 120 characters.",
  });
});

test("requires a meaningful description", () => {
  assert.deepEqual(validateJobDraft({ ...valid, description: "Too short" }), {
    ok: false,
    message: "Add a job description between 30 and 12,000 characters.",
  });
});

test("rejects unknown work modes", () => {
  assert.deepEqual(validateJobDraft({ ...valid, workMode: "anywhere" as "hybrid" }), {
    ok: false,
    message: "Choose a valid employment type and work mode.",
  });
});
