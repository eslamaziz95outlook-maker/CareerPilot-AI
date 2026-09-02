# Maintainer upgrade report

## Implemented

- Rewrote README around the actual open-source product, architecture, privacy boundary, limitations, quality checks, and evidence-grounding principles.
- Added CONTRIBUTING, SECURITY, ROADMAP, CHANGELOG, Code of Conduct, issue templates, pull-request template, CODEOWNERS, Dependabot, and GitHub Actions CI.
- Extracted deterministic matching/scoring into `src/lib/demo-analysis.ts` so it is independently testable.
- Added six regression tests for construction title/location extraction, evidence-grounding, unsupported requirements, experience thresholds, and preferred weighting.
- Added Dhahran to supported deterministic location extraction.
- Changed experience handling so a requirement far beyond the demo candidate's verified experience is marked missing instead of indefinitely partial.
- Removed a client-side network-error fallback that could display an unrelated sample-job analysis after the user pasted a different job description.
- Added `.env.example` and removed the hardcoded live-AI model name; live mode now requires explicit `OPENAI_MODEL` configuration.
- Added bounded cleanup to the in-memory request cooldown map.
- Drafted truthful first-release notes, issue seeds, and Codex for Open Source application language.

## Verification performed in this workspace

`node --experimental-strip-types --test tests/*.test.ts` passed: 6 tests, 0 failures.

Full dependency-backed lint/typecheck/build could not be executed in this isolated workspace because package-manager network access to the npm registry was unavailable and the uploaded ZIP did not contain `node_modules`. The included GitHub Actions workflow runs install, lint, typecheck, tests, and build after the repository is pushed.

## Remaining manual/connected actions

- Push these files to the public GitHub repository.
- Let GitHub Actions complete and fix any dependency-backed CI finding if one appears.
- Create only genuine unresolved issues (suggestions are in `docs/ISSUE_SEEDS.md`).
- Tag/publish `v0.1.0` only when the default branch is green and you are ready to make the release real.
- Update repository About/Topics/Homepage fields in GitHub UI if desired.
- Submit the OpenAI form only with truthful current metrics and the requested OpenAI Organization ID.
