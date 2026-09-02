# Security Policy

## Reporting a vulnerability

Please do not publish a suspected vulnerability in a public issue. Use GitHub's private security-advisory workflow for this repository when available. Include affected files, reproduction steps, impact, and a suggested mitigation if known.

## Supported versions

The project is currently an early MVP. Security fixes target the latest code on the default branch and the latest tagged release.

## Sensitive data

Career documents can contain names, contact details, employment history, IDs, and certifications. The current Career Vault stores uploaded files in browser IndexedDB and does not upload them to a backend.

Contributors must not add telemetry, document uploads, external parsing, or third-party persistence for Career Vault data without explicit disclosure, user control, and a security/privacy review.

## API keys

- Never commit `.env.local` or real API keys.
- Keep `OPENAI_API_KEY` server-side.
- Use `.env.example` only for variable names and safe placeholder values.
- Rotate any key that is accidentally exposed.

## Live AI mode

Live mode is opt-in. Production deployments should add a durable rate limiter, abuse controls, logging that excludes sensitive document contents, clear retention behavior, and an explicit model/configuration review before handling real candidate data.
