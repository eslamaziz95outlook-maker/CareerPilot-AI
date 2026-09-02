# Legitimate issue seeds

Create these as real GitHub issues only if they are still unresolved after the corresponding code is merged. Do not backdate or pretend they pre-existed.

## Add candidate-reviewed document extraction

**Labels:** enhancement

The current Career Vault stores documents locally but does not extract structured evidence from them. Design a privacy-conscious extraction flow where every extracted claim is reviewable by the candidate before becoming verified evidence. Define the evidence schema, source references, conflict handling, and deletion behavior before implementation.

## Add evidence citations to generated application material

**Labels:** enhancement

Tailored CV and cover-letter output should be able to trace important claims back to verified evidence. Design a citation/reference model that can identify the supporting source document or verified profile field without exposing private documents unnecessarily.

## Expand deterministic construction terminology tests

**Labels:** testing, enhancement

Add regression cases for common civil/construction terminology, synonyms, preferred-vs-required wording, experience ranges, Saudi locations, and ambiguous requirements. Each case should verify that unsupported candidate claims remain missing rather than matched.

## Perform accessibility audit of bilingual UI

**Labels:** accessibility

Audit keyboard navigation, focus order, labels, dialog/preview behavior, status announcements, contrast, and Arabic RTL behavior. Record reproducible findings and address them incrementally.

## Replace in-memory live-mode throttling for production

**Labels:** security, infrastructure

The API route currently uses a lightweight in-memory cooldown suitable for the MVP. Define and implement a durable production rate-limit/abuse-control strategy before live AI is treated as production-ready. Document proxy/IP assumptions and avoid logging job-description contents unnecessarily.
