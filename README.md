# CareerPilot AI

CareerPilot AI is an open-source, bilingual Arabic–English career application workspace built for construction and civil-engineering professionals. It turns documented career evidence into transparent job-fit analysis and grounded application materials without inventing qualifications.

> **Status:** early public MVP (`v0.1.0`). Demo mode is deterministic and makes no OpenAI API requests. Optional live-AI mode exists behind explicit environment configuration.

## Why this project exists

Construction candidates often manage CVs, certificates, job descriptions, and application drafts across disconnected tools. Generic AI assistants can also overstate experience if they are not grounded in verified source material. CareerPilot AI explores a stricter workflow:

1. keep career evidence under the candidate's control;
2. compare a job description against verified evidence;
3. separate matched, partial, and missing requirements;
4. show how the match score was calculated; and
5. prepare application material without fabricating qualifications.

## Current features

- Arabic and English interface with RTL/LTR layouts
- Browser-local Career Vault for PDF, DOCX, JPG, and PNG documents
- IndexedDB persistence and local file previews
- Deterministic construction-focused job-description analysis
- Explicit matched / partially matched / missing requirement groups
- Weighted score breakdown across experience, education, certifications, skills, management, eligibility, and language
- Application-material workspace and lightweight tracker UI
- Server-side OpenAI Responses API integration reserved for opt-in live mode
- No automated job submission or LinkedIn scraping

## Architecture

```text
Browser
  ├─ Next.js / React UI
  ├─ IndexedDB Career Vault
  └─ POST /api/job-analysis
       ├─ Demo mode: deterministic rules in src/lib/demo-analysis.ts
       └─ Live mode: OpenAI Responses API (opt-in)
```

Core stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide React, OpenAI JavaScript SDK.

## Local development

Requirements:

- Node.js 22 recommended
- pnpm 10 recommended

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local   # Windows: copy .env.example .env.local
pnpm dev
```

Open `http://127.0.0.1:3000`.

### Environment variables

```env
ENABLE_LIVE_AI=false
OPENAI_API_KEY=
OPENAI_MODEL=
```

`ENABLE_LIVE_AI=false` is the safe default. When live mode is enabled, both `OPENAI_API_KEY` and `OPENAI_MODEL` must be configured server-side.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The deterministic matching engine has regression tests covering title/location extraction, evidence-grounding behavior, experience thresholds, unsupported requirements, and preferred-requirement weighting.

## Privacy and security

In the current MVP, Career Vault documents stay in browser IndexedDB; there is no document-upload backend. Object URLs used for previews are revoked when closed. Secrets are loaded from server-side environment variables and must never be committed.

Read [SECURITY.md](SECURITY.md) before enabling live AI or deploying a modified version that handles real candidate data.

## Evidence-grounding principle

CareerPilot AI should never present an unsupported qualification as verified. New matching rules, prompts, exports, or AI features should preserve these principles:

- distinguish verified evidence from inference;
- show missing requirements rather than silently filling them;
- avoid inventing employers, dates, certifications, tools, achievements, or work authorization;
- keep recommendation logic explainable where practical; and
- require user review before application material is treated as final.

## Current limitations

- The bundled candidate profile is an anonymized demo fixture, not a general document-extraction pipeline.
- Deterministic matching covers a focused set of construction terminology.
- DOCX inline preview is intentionally limited by browser support.
- The application tracker is an MVP UI and does not submit applications.
- Live AI is optional and requires deployment-specific privacy, billing, rate-limit, and model decisions.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Near-term work includes candidate-reviewed document extraction, richer evidence citations, broader construction terminology, accessibility improvements, exportable application packs, and production-grade rate limiting for live mode.

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security concerns according to [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).

## Maintainer

Maintained by the repository owner. Project decisions favor truthfulness, candidate control, practical construction-industry workflows, and small reviewable changes.
