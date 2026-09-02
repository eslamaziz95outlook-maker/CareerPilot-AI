import assert from "node:assert/strict";
import test from "node:test";
import { demoAnalysis, extractLocation, extractTitle } from "../src/lib/demo-analysis.ts";

test("extracts supported construction title", () => {
  assert.equal(extractTitle("We are hiring a Senior Site Engineer in Riyadh"), "Senior Site Engineer");
});

test("extracts Saudi location including Dhahran", () => {
  assert.equal(extractLocation("Location: Dhahran, Saudi Arabia"), "Dhahran, Saudi Arabia");
});

test("does not invent requirements from an empty description", () => {
  const result = demoAnalysis("General opportunity with no listed requirements.");
  assert.equal(result.overallMatchScore, 0);
  assert.equal(result.jobTitle, "Not specified");
  assert.deepEqual(result.matchedRequirements, []);
  assert.deepEqual(result.missingRequirements, []);
  assert.equal(result.recommendation, "Skip");
});

test("matches verified evidence and flags unsupported requirements", () => {
  const result = demoAnalysis(`
    Company: Example Build Co
    Senior Site Engineer
    Location: Riyadh, Saudi Arabia
    Bachelor Civil Engineering required.
    5+ years experience required.
    PMP preferred. AutoCAD required. Primavera P6 required.
    Valid Saudi driving licence required.
  `);
  assert.equal(result.company, "Example Build Co");
  assert.equal(result.location, "Riyadh, Saudi Arabia");
  assert.equal(result.requiredExperience, "5+ years of experience");
  assert.ok(result.matchedRequirements.includes("B.Sc. Civil Engineering"));
  assert.ok(result.matchedRequirements.includes("AutoCAD"));
  assert.ok(result.matchedRequirements.includes("Valid Saudi driving licence"));
  assert.ok(result.missingRequirements.includes("Primavera P6"));
  assert.ok(result.overallMatchScore >= 0 && result.overallMatchScore <= 100);
});

test("treats experience well beyond verified history as missing", () => {
  const result = demoAnalysis("Construction Manager with 10+ years experience required.");
  assert.ok(result.missingRequirements.some((item) => item.startsWith("10+ years")));
});

test("reduces weight for preferred requirements", () => {
  const preferred = demoAnalysis("Senior Site Engineer. Primavera P6 preferred.");
  const required = demoAnalysis("Senior Site Engineer. Primavera P6 required.");
  const p = preferred.scoreBreakdown.find((x) => x.category === "Technical skills")!;
  const r = required.scoreBreakdown.find((x) => x.category === "Technical skills")!;
  assert.ok(p.possible < r.possible);
});
