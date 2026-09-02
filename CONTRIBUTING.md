# Contributing to CareerPilot AI

Thanks for helping improve CareerPilot AI. Contributions should strengthen maintainability, accessibility, privacy, or evidence-grounded career workflows.

## Development setup

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Demo mode does not require an API key.

## Before opening a pull request

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Keep changes focused. Avoid drive-by dependency upgrades unless they address a clear compatibility or security reason.

## Branch and PR workflow

1. Open or reference an issue for non-trivial changes.
2. Create a focused branch such as `fix/vault-error-state` or `feat/evidence-citations`.
3. Add or update tests when behavior changes.
4. Update documentation for user-visible or operational changes.
5. Open a pull request using the template and explain how the change was verified.

## Evidence-grounding rules

Do not add logic or prompts that fabricate candidate evidence. Unsupported experience, certifications, employers, dates, tools, achievements, language levels, or work eligibility must remain unsupported until evidence exists.

## Coding guidelines

- Prefer small pure functions for matching/scoring logic.
- Keep deterministic behavior covered by tests.
- Preserve Arabic/English behavior and RTL/LTR usability.
- Do not expose API keys or send Career Vault files to a server without an explicit product/design change and privacy review.
- Favor accessible HTML and keyboard-visible focus states.

## Good first contribution areas

- deterministic matching regression cases;
- accessibility and keyboard navigation;
- construction terminology and synonym coverage;
- clearer error states;
- documentation;
- privacy-preserving document parsing prototypes.
