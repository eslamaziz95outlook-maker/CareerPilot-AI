# Changelog

All notable changes to this project will be documented here. The format follows Keep a Changelog principles and the project uses semantic versioning for tagged releases.

## [Unreleased]

### Added
- Open-source contribution, security, code-of-conduct, roadmap, and issue/PR templates.
- Continuous-integration workflow for lint, type checking, tests, and build.
- Regression tests for deterministic job analysis.
- Explicit `.env.example` and configurable live-AI model setting.

### Changed
- Extracted deterministic analysis into a testable library module.
- Hardened request-key cleanup for the in-memory demo/live API throttle.
- Expanded supported location extraction to include Dhahran.
- Tightened experience scoring so substantially higher requirements are not treated as partial evidence indefinitely.

## [0.1.0] - Unreleased

Initial public MVP. A release date should be added only when the tag is actually published.
