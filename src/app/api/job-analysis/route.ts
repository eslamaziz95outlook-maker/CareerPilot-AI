import OpenAI from "openai";
import { NextResponse } from "next/server";
import { demoAnalysis, verifiedCandidate } from "@/lib/demo-analysis";

export const runtime = "nodejs";

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "jobTitle", "company", "location", "requiredExperience", "requiredSkills",
    "certifications", "matchedRequirements", "partiallyMatchedRequirements",
    "missingRequirements", "scoreBreakdown", "overallMatchScore", "recommendation",
  ],
  properties: {
    jobTitle: { type: "string" },
    company: { type: "string" },
    location: { type: "string" },
    requiredExperience: { type: "string" },
    requiredSkills: { type: "array", items: { type: "string" } },
    certifications: { type: "array", items: { type: "string" } },
    matchedRequirements: { type: "array", items: { type: "string" } },
    partiallyMatchedRequirements: { type: "array", items: { type: "string" } },
    missingRequirements: { type: "array", items: { type: "string" } },
    scoreBreakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "earned", "possible"],
        properties: {
          category: { type: "string" },
          earned: { type: "integer" },
          possible: { type: "integer" },
        },
      },
    },
    overallMatchScore: { type: "integer", minimum: 0, maximum: 100 },
    recommendation: { type: "string", enum: ["Apply", "Review", "Skip"] },
  },
} as const;

const recentRequests = new Map<string, number>();
const REQUEST_COOLDOWN_MS = 3_000;
const MAX_REQUEST_KEYS = 2_000;

function json(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function allowRequest(key: string) {
  const now = Date.now();
  const last = recentRequests.get(key) || 0;
  if (now - last < REQUEST_COOLDOWN_MS) return false;
  recentRequests.set(key, now);
  if (recentRequests.size > MAX_REQUEST_KEYS) {
    for (const [candidateKey, timestamp] of recentRequests) {
      if (now - timestamp > REQUEST_COOLDOWN_MS * 4) recentRequests.delete(candidateKey);
      if (recentRequests.size <= MAX_REQUEST_KEYS) break;
    }
  }
  return true;
}

export async function POST(request: Request) {
  let jobDescription = "";
  try {
    const body = await request.json();
    jobDescription = typeof body?.jobDescription === "string" ? body.jobDescription.trim() : "";
    if (!jobDescription || jobDescription.length > 3000) {
      return json({ error: "Provide a job description between 1 and 3,000 characters." }, 400);
    }

    const requestKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!allowRequest(requestKey)) return json({ error: "Please wait a moment before another analysis." }, 429);

    if (process.env.ENABLE_LIVE_AI !== "true") return json(demoAnalysis(jobDescription));

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;
    if (!apiKey || !model) {
      return json({ ...demoAnalysis(jobDescription), fallbackReason: "Live AI is not fully configured." });
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model,
      store: false,
      max_output_tokens: 800,
      input: [
        {
          role: "developer",
          content: `You analyze construction job descriptions for CareerPilot AI. Use ONLY this verified candidate data:\n${JSON.stringify(verifiedCandidate)}\n\nDo not invent qualifications, experience, certifications, employers, or achievements. Extract facts only when stated in the description; otherwise return "Not specified" for text and [] for lists. Mark a requirement matched only when the verified candidate data directly supports it. Treat unsupported or ambiguous requirements as missing. Score conservatively.`,
        },
        { role: "user", content: `Analyze this job description:\n\n${jobDescription}` },
      ],
      text: { format: { type: "json_schema", name: "careerpilot_job_analysis", strict: true, schema } },
    });

    if (!response.output_text) {
      return json({ ...demoAnalysis(jobDescription), fallbackReason: "Live AI returned no structured result." });
    }
    return json({ source: "live", ...JSON.parse(response.output_text) });
  } catch {
    return json({ ...demoAnalysis(jobDescription), fallbackReason: "Live AI is temporarily unavailable." });
  }
}
