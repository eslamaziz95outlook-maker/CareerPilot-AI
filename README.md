# CareerPilot AI

CareerPilot AI is a bilingual Arabic–English career application workspace for construction professionals. It connects document-backed evidence with transparent job matching, without inventing qualifications or automating job applications.

## Problem and solution

Construction candidates often juggle CVs, certificates, long job descriptions, and application drafts across disconnected tools. CareerPilot AI provides a private, local-first workflow: store source documents in Career Vault, see a verified profile, compare it to a pasted role, and generate grounded application materials.

## Main features

- Arabic/English interface with RTL and LTR layouts
- Browser-local Career Vault for PDF, DOCX, JPG, and PNG files
- IndexedDB persistence, processing state, removal, and local image/PDF previews
- Evidence-linked anonymous demo profile, PMP certification, and target roles
- Deterministic offline Demo Analysis for construction job descriptions
- Weighted matched, partially matched/unverified, and missing requirement groups
- Transparent score breakdown by experience, education, certifications, skills, management, eligibility, and language
- Tailored CV, cover letter, recruiter message, and application tracker

## Architecture and technology stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- IndexedDB and Blob object URLs for local document storage and previews
- Server-side `src/app/api/job-analysis` route for matching
- Lucide React icons
- Official OpenAI JavaScript SDK and Responses API retained for optional future live mode

## Setup and run

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Open `http://127.0.0.1:3000`.

Use these environment values for the submission demo:

```env
OPENAI_API_KEY=
ENABLE_LIVE_AI=false
```

Validation commands:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Demo Mode testing

Click **Demo Candidate**, then paste a Construction Manager description that includes Dammam, Saudi Arabia, PMP, Saudi Council registration, management responsibilities, and eligibility requirements. Select **Analyze with AI**. The card is labelled **Demo Analysis** and shows three evidence groups plus a weighted score. Add temporary PDF, DOCX, JPG, and PNG files in Career Vault to verify browser-local upload, preview, closing/reopening, and reload persistence.

**Demo Mode requires no API credits and sends zero OpenAI API requests.**

## Codex and GPT-5.6

Codex was used to implement, test, and prepare this MVP. The repository retains a server-side official OpenAI SDK integration using the Responses API and `gpt-5.6-terra`. It is guarded by `ENABLE_LIVE_AI`; with the required value `false`, the route returns deterministic Demo Analysis before an OpenAI client is created or a request is sent. GPT-5.6 is therefore preserved for a future opt-in mode, not used by the submission demo.

## Privacy and security

- Uploaded documents stay in the browser's IndexedDB; there is no document upload server.
- Preview object URLs are revoked after closing the preview.
- `.env.local` and `.env*` are ignored by Git.
- API keys are server-side only and are never returned, printed, or logged.
- The candidate is anonymized. There is no LinkedIn scraping or automated application submission.

## Current limitations

- The profile is a controlled anonymous demo persona.
- Demo matching is deterministic and supports common construction terminology rather than every possible phrasing.
- DOCX files use a download/open fallback because inline browser rendering is unreliable.
- The tracker is an MVP board and does not submit applications.

## Future roadmap

- Candidate-reviewed document extraction and claim verification
- More industry-specific requirement dictionaries
- Exportable application packs
- Optional live analysis after explicit billing, privacy, and rate-control review

Submission materials: [Devpost copy](DEVPOST_SUBMISSION.md), [video script](VIDEO_SCRIPT.md), [deployment guide](DEPLOYMENT.md), and [final checklist](FINAL_CHECKLIST.md).
