import test from "node:test";
import assert from "node:assert/strict";
import { getHiringTemplate, hiringTemplates } from "./catalog.ts";

test("catalogue contains all four required hiring template families", () => {
  assert.deepEqual(hiringTemplates.map((template) => template.id), [
    "small-business",
    "corporate",
    "creative-gaming",
    "cultural-festival",
  ]);
});

test("every template has complete preview content and an application section", () => {
  for (const template of hiringTemplates) {
    assert.ok(template.name.length > 0);
    assert.ok(template.description.length > 20);
    assert.match(template.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(template.sections.length >= 4);
    assert.ok(template.sections.some((section) => /apply|application/i.test(section)));
  }
});

test("template lookup returns the requested template and safely handles unknown values", () => {
  assert.equal(getHiringTemplate("corporate")?.name, "Corporate");
  assert.equal(getHiringTemplate("small-business")?.id, "small-business");
  assert.equal(getHiringTemplate("unknown" as never), undefined);
});
