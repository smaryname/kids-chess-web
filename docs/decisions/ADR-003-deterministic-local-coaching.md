# ADR-003 — Deterministic local coaching

## Decision

Milestone 2 coaching and “Help Me” suggestions run entirely in the browser. Suggestions use a small deterministic evaluator over legal moves, and optional speech uses the browser’s native speech-synthesis capability.

## Why

Children need immediate, predictable help without accounts, network delays, data collection, or generated content. Keeping the coach on-device preserves the local-first promise and makes suggestions easy to test.

## Alternatives considered

- A hosted chess engine would provide deeper analysis but would add a backend, operations, and privacy concerns.
- A generative-AI coach could vary its explanations but would be nondeterministic and outside the approved scope.
- No move suggestions would keep the interface simpler but would not deliver the planned Milestone 2 learning support.

## Tradeoffs

The evaluator prefers clear tactical and developmental ideas but is not a full-strength chess engine. Native speech quality and voice availability vary by browser and device, so written coaching remains the source of truth and speech is opt-in.

## When we should reconsider it

Revisit this decision when the product needs stronger position analysis, skill-level adaptation, curated lesson plans, or consistent high-quality voices across devices.
