import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AnalysisSource = "live" | "demo";
type RequirementStatus = "matched" | "partial" | "missing";
type ScoreCategory =
  | "Experience"
  | "Education"
  | "Certifications"
  | "Technical skills"
  | "Management responsibilities"
  | "Location and work eligibility"
  | "Language";
type RequirementRule = {
  label: string;
  category: ScoreCategory;
  weight: number;
  patterns: RegExp[];
  status: RequirementStatus;
};

const verifiedCandidate = {
  education: ["B.Sc. Civil Engineering"],
  experience: "5 years, 8 months in construction",
  registration: "Saudi Council of Engineers registration (valid)",
  skills: [
    "AutoCAD",
    "Site supervision",
    "QA/QC",
    "Concrete works",
    "Safety compliance",
    "Construction planning",
    "Team coordination",
  ],
  certifications: [
    "PMP certification (verified; evidence: PMP_Certificate.pdf)",
    "AutoCAD training certificate",
  ],
  licence: "Valid Saudi driving licence",
  location: "Riyadh, Saudi Arabia",
  targetRoles: [
    "Construction Manager",
    "QA/QC Manager",
    "Senior QA/QC Engineer",
    "Senior Civil Engineer",
    "Senior Site Engineer",
  ],
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "jobTitle",
    "company",
    "location",
    "requiredExperience",
    "requiredSkills",
    "certifications",
    "matchedRequirements",
    "partiallyMatchedRequirements",
    "missingRequirements",
    "scoreBreakdown",
    "overallMatchScore",
    "recommendation",
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

const requirementRules: RequirementRule[] = [
  {
    label: "B.Sc. Civil Engineering",
    category: "Education",
    weight: 12,
    patterns: [
      /\bcivil engineering\b/i,
      /\bb\.?\s?sc\.?\b.*\bcivil\b/i,
      /\bbachelor(?:'s)?\b.*\bcivil\b/i,
    ],
    status: "matched",
  },
  {
    label: "PMP certification",
    category: "Certifications",
    weight: 3,
    patterns: [/\bpmp\b/i, /\bproject management professional\b/i],
    status: "matched",
  },
  {
    label: "Saudi Council of Engineers registration",
    category: "Certifications",
    weight: 8,
    patterns: [/\bsaudi council of engineers\b/i, /\bsc[e]? registration\b/i],
    status: "matched",
  },
  {
    label: "Site management",
    category: "Management responsibilities",
    weight: 10,
    patterns: [
      /\bsite management\b/i,
      /\bmanage(?:ment)?\s+(?:of )?(?:the )?site\b/i,
    ],
    status: "partial",
  },
  {
    label: "Civil and architectural works",
    category: "Technical skills",
    weight: 9,
    patterns: [
      /\bcivil\s+(?:and|&)\s+architectural works?\b/i,
      /\barchitectural\s+(?:and|&)\s+civil works?\b/i,
    ],
    status: "partial",
  },
  {
    label: "Consultant coordination",
    category: "Management responsibilities",
    weight: 7,
    patterns: [
      /\bconsultant coordination\b/i,
      /\bcoordinate\s+with\s+consultants?\b/i,
    ],
    status: "partial",
  },
  {
    label: "Subcontractor management",
    category: "Management responsibilities",
    weight: 9,
    patterns: [
      /\bsubcontractor management\b/i,
      /\bmanage\s+subcontractors?\b/i,
    ],
    status: "missing",
  },
  {
    label: "Project planning",
    category: "Management responsibilities",
    weight: 8,
    patterns: [
      /\bproject planning\b/i,
      /\bconstruction planning\b/i,
      /\bwork planning\b/i,
    ],
    status: "matched",
  },
  {
    label: "Progress monitoring",
    category: "Management responsibilities",
    weight: 7,
    patterns: [/\bprogress monitoring\b/i, /\bmonitor(?:ing)?\s+progress\b/i],
    status: "missing",
  },
  {
    label: "Managing engineers and workers",
    category: "Management responsibilities",
    weight: 9,
    patterns: [
      /\bmanag(?:e|ing)\s+(?:engineers?|workers?|staff|teams?)\b/i,
      /\bengineers?\s+and\s+workers?\b/i,
    ],
    status: "partial",
  },
  {
    label: "RFIs, MIRs, and NCRs",
    category: "Technical skills",
    weight: 8,
    patterns: [/\brfis?\b/i, /\bmi[rs]s?\b/i, /\bncrs?\b/i],
    status: "partial",
  },
  {
    label: "Method statements",
    category: "Technical skills",
    weight: 6,
    patterns: [/\bmethod statements?\b/i],
    status: "missing",
  },
  {
    label: "Inspections",
    category: "Technical skills",
    weight: 6,
    patterns: [/\binspections?\b/i, /\binspect\b/i],
    status: "partial",
  },
  {
    label: "English communication",
    category: "Language",
    weight: 5,
    patterns: [
      /\benglish (?:communication|language|speaking|writing)\b/i,
      /\bcommunicat(?:e|ion)\s+in\s+english\b/i,
    ],
    status: "missing",
  },
  {
    label: "Transferable Iqama",
    category: "Location and work eligibility",
    weight: 8,
    patterns: [/\btransfer(?:able)?\s+iqama\b/i],
    status: "missing",
  },
  {
    label: "Valid Saudi driving licence",
    category: "Location and work eligibility",
    weight: 6,
    patterns: [/\bsaudi driving licen[cs]e\b/i],
    status: "matched",
  },
  {
    label: "AutoCAD",
    category: "Technical skills",
    weight: 5,
    patterns: [/\bautocad\b/i],
    status: "matched",
  },
  {
    label: "Primavera P6",
    category: "Technical skills",
    weight: 5,
    patterns: [/\bprimavera\s*p6\b/i],
    status: "missing",
  },
  {
    label: "Aramco project experience",
    category: "Technical skills",
    weight: 5,
    patterns: [/\baramco\b/i],
    status: "missing",
  },
  {
    label: "BIM",
    category: "Technical skills",
    weight: 5,
    patterns: [/\bbim\b/i, /\bbuilding information modeling\b/i],
    status: "missing",
  },
  {
    label: "Revit",
    category: "Technical skills",
    weight: 5,
    patterns: [/\brevit\b/i],
    status: "missing",
  },
];

const titleRules = [
  "Construction Manager",
  "QA/QC Manager",
  "Senior QA/QC Engineer",
  "Senior Civil Engineer",
  "Senior Site Engineer",
  "Site Engineer",
  "Project Engineer",
  "Civil Site Supervisor",
];

function extractTitle(text: string) {
  return (
    titleRules.find((title) =>
      new RegExp(
        `\\b${title.replace(/[/.]/g, "\\$&").replace(/ /g, "\\s+")}\\b`,
        "i",
      ).test(text),
    ) || "Not specified"
  );
}

function extractField(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[.,;]+$/, "");
  }
  return "Not specified";
}

function extractLocation(text: string) {
  const match =
    text.match(
      /\b(?:location|based in|city)\s*[:\-]?\s*(Dammam|Riyadh|Jeddah|Khobar)(?:\s*,\s*(Saudi Arabia))?/i,
    ) || text.match(/\b(Dammam|Riyadh|Jeddah|Khobar)\s*,\s*(Saudi Arabia)\b/i);
  if (!match) return "Not specified";
  return `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()}, ${match[2] || "Saudi Arabia"}`;
}

function isPreferred(text: string, rule: RequirementRule) {
  const index = text.search(rule.patterns[0]);
  return (
    index >= 0 &&
    /\b(preferred|desirable|nice to have|advantage)\b/i.test(
      text.slice(Math.max(0, index - 60), index + 90),
    )
  );
}

function demoAnalysis(jobDescription: string) {
  const extractedRules = requirementRules
    .filter((rule) =>
      rule.patterns.some((pattern) => pattern.test(jobDescription)),
    )
    .map((rule) => ({
      ...rule,
      weight: isPreferred(jobDescription, rule)
        ? Math.min(rule.weight, 3)
        : rule.weight,
    }));
  const experienceMatch =
    jobDescription.match(
      /\b(\d{1,2})\s*(\+|plus)?\s*(?:years?|yrs?)\b[^.\n]{0,45}(?:experience|exp\.)/i,
    ) ||
    jobDescription.match(
      /(?:experience|exp\.)[^.\n]{0,45}\b(\d{1,2})\s*(\+|plus)?\s*(?:years?|yrs?)\b/i,
    );
  const years = experienceMatch ? Number(experienceMatch[1]) : null;
  const requiredExperience =
    years === null
      ? "Not specified"
      : `${years}${experienceMatch?.[2] ? "+" : ""} years of experience`;
  if (years !== null)
    extractedRules.push({
      label: `${years}${experienceMatch?.[2] ? "+" : ""} years of relevant construction experience`,
      category: "Experience",
      weight: 14,
      patterns: [],
      status: years <= 5 ? "matched" : "partial",
    });
  const location = extractLocation(jobDescription);
  if (location !== "Not specified")
    extractedRules.push({
      label: `${location} location / availability`,
      category: "Location and work eligibility",
      weight: 7,
      patterns: [],
      status: location === verifiedCandidate.location ? "matched" : "partial",
    });

  const matchedRequirements = extractedRules
    .filter((rule) => rule.status === "matched")
    .map((rule) => rule.label);
  const partiallyMatchedRequirements = extractedRules
    .filter((rule) => rule.status === "partial")
    .map((rule) => rule.label);
  const missingRequirements = extractedRules
    .filter((rule) => rule.status === "missing")
    .map((rule) => rule.label);
  const categories: ScoreCategory[] = [
    "Experience",
    "Education",
    "Certifications",
    "Technical skills",
    "Management responsibilities",
    "Location and work eligibility",
    "Language",
  ];
  const scoreBreakdown = categories.map((category) => {
    const requirements = extractedRules.filter(
      (rule) => rule.category === category,
    );
    const possible = requirements.reduce(
      (total, rule) => total + rule.weight,
      0,
    );
    const earned = requirements.reduce(
      (total, rule) =>
        total +
        (rule.status === "matched"
          ? rule.weight
          : rule.status === "partial"
            ? Math.round(rule.weight * 0.45)
            : 0),
      0,
    );
    return { category, earned, possible };
  });
  const possibleScore = scoreBreakdown.reduce(
    (total, group) => total + group.possible,
    0,
  );
  const earnedScore = scoreBreakdown.reduce(
    (total, group) => total + group.earned,
    0,
  );
  const overallMatchScore = possibleScore
    ? Math.round((earnedScore / possibleScore) * 100)
    : 0;

  return {
    source: "demo" as AnalysisSource,
    jobTitle: extractTitle(jobDescription),
    company: extractField(jobDescription, [
      /\bcompany\s*[:\-]\s*([^\n]+)/i,
      /\bat\s+([A-Z][A-Za-z0-9& .'-]{1,60}?)(?=\s+(?:in|based in|located in)\b|[.,;\n]|$)/,
    ]),
    location,
    requiredExperience,
    requiredSkills: extractedRules
      .filter(
        (rule) =>
          rule.category === "Technical skills" ||
          rule.category === "Management responsibilities",
      )
      .map((rule) => rule.label),
    certifications: extractedRules
      .filter((rule) => rule.category === "Certifications")
      .map((rule) => rule.label),
    matchedRequirements,
    partiallyMatchedRequirements,
    missingRequirements,
    scoreBreakdown,
    overallMatchScore,
    recommendation:
      overallMatchScore >= 80
        ? "Apply"
        : overallMatchScore >= 50
          ? "Review"
          : "Skip",
  };
}

function json(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let jobDescription = "";
  try {
    const body = await request.json();
    jobDescription =
      typeof body?.jobDescription === "string"
        ? body.jobDescription.trim()
        : "";
    if (!jobDescription || jobDescription.length > 3000)
      return json(
        { error: "Provide a job description between 1 and 3,000 characters." },
        400,
      );

    const requestKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const now = Date.now();
    const last = recentRequests.get(requestKey) || 0;
    if (now - last < REQUEST_COOLDOWN_MS)
      return json(
        { error: "Please wait a moment before another analysis." },
        429,
      );
    recentRequests.set(requestKey, now);

    if (process.env.ENABLE_LIVE_AI !== "true")
      return json(demoAnalysis(jobDescription));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
      return json({
        ...demoAnalysis(jobDescription),
        fallbackReason: "Live AI is not configured.",
      });

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: "gpt-5.6-terra",
      store: false,
      max_output_tokens: 800,
      input: [
        {
          role: "developer",
          content: `You analyze construction job descriptions for CareerPilot AI. Use ONLY this verified candidate data:\n${JSON.stringify(verifiedCandidate)}\n\nDo not invent qualifications, experience, certifications, employers, or achievements. Extract facts only when stated in the description; otherwise return "Not specified" for text and [] for lists. Mark a requirement matched only when the verified candidate data directly supports it. Treat unsupported, ambiguous, and preferred requirements as missing. Score conservatively.`,
        },
        {
          role: "user",
          content: `Analyze this job description:\n\n${jobDescription}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "careerpilot_job_analysis",
          strict: true,
          schema,
        },
      },
    });

    if (!response.output_text)
      return json({
        ...demoAnalysis(jobDescription),
        fallbackReason: "Live AI returned no structured result.",
      });
    return json({
      source: "live" as AnalysisSource,
      ...JSON.parse(response.output_text),
    });
  } catch {
    return json({
      ...demoAnalysis(jobDescription),
      fallbackReason: "Live AI is temporarily unavailable.",
    });
  }
}
