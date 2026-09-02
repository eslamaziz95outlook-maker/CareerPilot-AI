export type AnalysisSource = "live" | "demo";
export type RequirementStatus = "matched" | "partial" | "missing";
export type ScoreCategory =
  | "Experience"
  | "Education"
  | "Certifications"
  | "Technical skills"
  | "Management responsibilities"
  | "Location and work eligibility"
  | "Language";

export type JobAnalysis = {
  source: AnalysisSource;
  fallbackReason?: string;
  jobTitle: string;
  company: string;
  location: string;
  requiredExperience: string;
  requiredSkills: string[];
  certifications: string[];
  matchedRequirements: string[];
  partiallyMatchedRequirements: string[];
  missingRequirements: string[];
  scoreBreakdown: { category: ScoreCategory; earned: number; possible: number }[];
  overallMatchScore: number;
  recommendation: "Apply" | "Review" | "Skip";
};

type RequirementRule = {
  label: string;
  category: ScoreCategory;
  weight: number;
  patterns: RegExp[];
  status: RequirementStatus;
};

export const verifiedCandidate = {
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
} as const;

const requirementRules: RequirementRule[] = [
  { label: "B.Sc. Civil Engineering", category: "Education", weight: 12, patterns: [/\bcivil engineering\b/i, /\bb\.?\s?sc\.?\b.*\bcivil\b/i, /\bbachelor(?:'s)?\b.*\bcivil\b/i], status: "matched" },
  { label: "PMP certification", category: "Certifications", weight: 3, patterns: [/\bpmp\b/i, /\bproject management professional\b/i], status: "matched" },
  { label: "Saudi Council of Engineers registration", category: "Certifications", weight: 8, patterns: [/\bsaudi council of engineers\b/i, /\bsce registration\b/i], status: "matched" },
  { label: "Site management", category: "Management responsibilities", weight: 10, patterns: [/\bsite management\b/i, /\bmanage(?:ment)?\s+(?:of )?(?:the )?site\b/i], status: "partial" },
  { label: "Civil and architectural works", category: "Technical skills", weight: 9, patterns: [/\bcivil\s+(?:and|&)\s+architectural works?\b/i, /\barchitectural\s+(?:and|&)\s+civil works?\b/i], status: "partial" },
  { label: "Consultant coordination", category: "Management responsibilities", weight: 7, patterns: [/\bconsultant coordination\b/i, /\bcoordinate\s+with\s+consultants?\b/i], status: "partial" },
  { label: "Subcontractor management", category: "Management responsibilities", weight: 9, patterns: [/\bsubcontractor management\b/i, /\bmanage\s+subcontractors?\b/i], status: "missing" },
  { label: "Project planning", category: "Management responsibilities", weight: 8, patterns: [/\bproject planning\b/i, /\bconstruction planning\b/i, /\bwork planning\b/i], status: "matched" },
  { label: "Progress monitoring", category: "Management responsibilities", weight: 7, patterns: [/\bprogress monitoring\b/i, /\bmonitor(?:ing)?\s+progress\b/i], status: "missing" },
  { label: "Managing engineers and workers", category: "Management responsibilities", weight: 9, patterns: [/\bmanag(?:e|ing)\s+(?:engineers?|workers?|staff|teams?)\b/i, /\bengineers?\s+and\s+workers?\b/i], status: "partial" },
  { label: "RFIs, MIRs, and NCRs", category: "Technical skills", weight: 8, patterns: [/\brfis?\b/i, /\bmirs?\b/i, /\bncrs?\b/i], status: "partial" },
  { label: "Method statements", category: "Technical skills", weight: 6, patterns: [/\bmethod statements?\b/i], status: "missing" },
  { label: "Inspections", category: "Technical skills", weight: 6, patterns: [/\binspections?\b/i, /\binspect\b/i], status: "partial" },
  { label: "English communication", category: "Language", weight: 5, patterns: [/\benglish (?:communication|language|speaking|writing)\b/i, /\bcommunicat(?:e|ion)\s+in\s+english\b/i], status: "missing" },
  { label: "Transferable Iqama", category: "Location and work eligibility", weight: 8, patterns: [/\btransfer(?:able)?\s+iqama\b/i], status: "missing" },
  { label: "Valid Saudi driving licence", category: "Location and work eligibility", weight: 6, patterns: [/\bsaudi driving licen[cs]e\b/i], status: "matched" },
  { label: "AutoCAD", category: "Technical skills", weight: 5, patterns: [/\bautocad\b/i], status: "matched" },
  { label: "Primavera P6", category: "Technical skills", weight: 5, patterns: [/\bprimavera\s*p6\b/i], status: "missing" },
  { label: "Aramco project experience", category: "Technical skills", weight: 5, patterns: [/\baramco\b/i], status: "missing" },
  { label: "BIM", category: "Technical skills", weight: 5, patterns: [/\bbim\b/i, /\bbuilding information modeling\b/i], status: "missing" },
  { label: "Revit", category: "Technical skills", weight: 5, patterns: [/\brevit\b/i], status: "missing" },
];

const titleRules = [
  "Construction Manager", "QA/QC Manager", "Senior QA/QC Engineer", "Senior Civil Engineer",
  "Senior Site Engineer", "Site Engineer", "Project Engineer", "Civil Site Supervisor",
];

export function extractTitle(text: string) {
  return titleRules.find((title) => new RegExp(`\\b${title.replace(/[/.]/g, "\\$&").replace(/ /g, "\\s+")}\\b`, "i").test(text)) || "Not specified";
}

function extractField(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[.,;]+$/, "");
  }
  return "Not specified";
}

export function extractLocation(text: string) {
  const match = text.match(/\b(?:location|based in|city)\s*[:\-]?\s*(Dammam|Riyadh|Jeddah|Khobar|Dhahran)(?:\s*,\s*(Saudi Arabia))?/i)
    || text.match(/\b(Dammam|Riyadh|Jeddah|Khobar|Dhahran)\s*,\s*(Saudi Arabia)\b/i);
  if (!match) return "Not specified";
  return `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()}, ${match[2] || "Saudi Arabia"}`;
}

function isPreferred(text: string, rule: RequirementRule) {
  const indexes = rule.patterns.map((pattern) => text.search(pattern)).filter((index) => index >= 0);
  if (!indexes.length) return false;
  return indexes.some((index) => /\b(preferred|desirable|nice to have|advantage)\b/i.test(text.slice(Math.max(0, index - 60), index + 90)));
}

export function demoAnalysis(jobDescription: string): JobAnalysis {
  const text = jobDescription.trim();
  const extractedRules = requirementRules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => ({ ...rule, weight: isPreferred(text, rule) ? Math.min(rule.weight, 3) : rule.weight }));

  const experienceMatch = text.match(/\b(\d{1,2})\s*(\+|plus)?\s*(?:years?|yrs?)\b[^.\n]{0,45}(?:experience|exp\.)/i)
    || text.match(/(?:experience|exp\.)[^.\n]{0,45}\b(\d{1,2})\s*(\+|plus)?\s*(?:years?|yrs?)\b/i);
  const years = experienceMatch ? Number(experienceMatch[1]) : null;
  const requiredExperience = years === null ? "Not specified" : `${years}${experienceMatch?.[2] ? "+" : ""} years of experience`;
  if (years !== null) {
    extractedRules.push({
      label: `${years}${experienceMatch?.[2] ? "+" : ""} years of relevant construction experience`,
      category: "Experience",
      weight: 14,
      patterns: [],
      status: years <= 5 ? "matched" : years <= 7 ? "partial" : "missing",
    });
  }

  const location = extractLocation(text);
  if (location !== "Not specified") {
    extractedRules.push({
      label: `${location} location / availability`,
      category: "Location and work eligibility",
      weight: 7,
      patterns: [],
      status: location === verifiedCandidate.location ? "matched" : "partial",
    });
  }

  const matchedRequirements = extractedRules.filter((rule) => rule.status === "matched").map((rule) => rule.label);
  const partiallyMatchedRequirements = extractedRules.filter((rule) => rule.status === "partial").map((rule) => rule.label);
  const missingRequirements = extractedRules.filter((rule) => rule.status === "missing").map((rule) => rule.label);
  const categories: ScoreCategory[] = ["Experience", "Education", "Certifications", "Technical skills", "Management responsibilities", "Location and work eligibility", "Language"];
  const scoreBreakdown = categories.map((category) => {
    const requirements = extractedRules.filter((rule) => rule.category === category);
    const possible = requirements.reduce((total, rule) => total + rule.weight, 0);
    const earned = requirements.reduce((total, rule) => total + (rule.status === "matched" ? rule.weight : rule.status === "partial" ? Math.round(rule.weight * 0.45) : 0), 0);
    return { category, earned, possible };
  });
  const possibleScore = scoreBreakdown.reduce((total, group) => total + group.possible, 0);
  const earnedScore = scoreBreakdown.reduce((total, group) => total + group.earned, 0);
  const overallMatchScore = possibleScore ? Math.round((earnedScore / possibleScore) * 100) : 0;

  return {
    source: "demo",
    jobTitle: extractTitle(text),
    company: extractField(text, [
      /\bcompany\s*[:\-]\s*([^\n]+)/i,
      /\bat\s+([A-Z][A-Za-z0-9& .'-]{1,60}?)(?=\s+(?:in|based in|located in)\b|[.,;\n]|$)/,
    ]),
    location,
    requiredExperience,
    requiredSkills: extractedRules.filter((rule) => rule.category === "Technical skills" || rule.category === "Management responsibilities").map((rule) => rule.label),
    certifications: extractedRules.filter((rule) => rule.category === "Certifications").map((rule) => rule.label),
    matchedRequirements,
    partiallyMatchedRequirements,
    missingRequirements,
    scoreBreakdown,
    overallMatchScore,
    recommendation: overallMatchScore >= 80 ? "Apply" : overallMatchScore >= 50 ? "Review" : "Skip",
  };
}
