# CareerPilot AI — Devpost Submission

## Project name

CareerPilot AI

## Tagline

Verified career evidence meets transparent job matching for construction professionals.

## Inspiration

Construction candidates often need to interpret long job descriptions, edit a CV repeatedly, and decide which qualifications can be stated with confidence. We wanted a more trustworthy workflow where claims are grounded in source documents and gaps are visible.

## What it does

CareerPilot AI is a bilingual Arabic–English, local-first career workspace. Users store source documents in a private Career Vault, review a verified profile, paste a construction job description, and receive a transparent Demo Analysis. It extracts requirements, compares them only with verified demo evidence, separates matched, partially matched/unverified, and missing requirements, and explains the weighted score. It also prepares a tailored CV, cover letter, recruiter message, and application tracker without fabricating qualifications.

## How it was built

The MVP uses Next.js, TypeScript, React, Tailwind CSS, and Lucide icons. Files are stored in IndexedDB and previewed with browser object URLs. A server-side Next.js route performs deterministic rule-based construction-role matching in safe Demo Mode. The codebase retains a server-only OpenAI Responses API integration using the official JavaScript SDK and GPT-5.6, protected by `ENABLE_LIVE_AI=false` for this submission.

## Challenges

The hardest part was making scoring useful instead of optimistic: recognizing detailed construction responsibilities, separating related evidence from direct evidence, weighting mandatory requirements above preferred items such as PMP, and never claiming unsupported qualifications. RTL Arabic layout also needed to coexist cleanly with English technical terms.

## Accomplishments that we're proud of

- A no-cost Demo Mode that sends zero OpenAI API requests
- Browser-local document uploads, persistence, and image/PDF previews
- Evidence-linked PMP and an anonymous candidate profile
- Detailed Construction Manager analysis with Dammam extraction and transparent weighted breakdowns
- Bilingual application materials grounded only in verified claims

## What we learned

Trustworthy career tooling needs clear evidence boundaries. A partial match is more useful than a false positive, and a score is only credible when people can see how it was calculated. Local-first workflows can provide polished demos without sending career documents to a server.

## What's next

Candidate-reviewed claim extraction, more construction discipline dictionaries, exportable application packs, and optional live analysis after explicit configuration, privacy safeguards, and rate controls.

## Built with

Next.js, React, TypeScript, Tailwind CSS, IndexedDB, Lucide React, OpenAI JavaScript SDK, OpenAI Responses API, GPT-5.6 (optional server-side integration), and Codex.

## Short judge testing instructions

1. Select **Demo Candidate**.
2. Paste a Construction Manager description that includes Dammam, PMP, Saudi Council registration, site management, and eligibility requirements.
3. Select **Analyze with AI**. Confirm the **Demo Analysis** label, three evidence groups, and weighted breakdown.
4. In Career Vault, confirm `PMP_Certificate.pdf` is evidence-linked; add a temporary JPG or PDF to test local preview.
5. Switch to Arabic and review the tailored CV, cover letter, recruiter message, and tracker.
