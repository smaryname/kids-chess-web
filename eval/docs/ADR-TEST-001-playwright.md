# ADR-TEST-001 — Playwright for browser evaluation

- **Decision:** Use Playwright for Milestone 1 component-interaction and end-to-end evaluation, while retaining Node’s built-in test runner for the DOM-free chess engine.
- **Why:** Playwright drives the real browser with mouse/touch-equivalent clicks, supports desktop and mobile projects, captures failure traces, and can launch the app automatically. The engine already has dependency-free Node tests.
- **Alternatives considered:** Cypress; Vitest plus a DOM emulator; browser-only manual testing.
- **Tradeoffs:** Playwright adds one development dependency and downloads a browser binary. Its tests are slower than unit tests and should focus on critical user journeys rather than exhaustively duplicating engine cases.
- **When to reconsider:** Revisit if the project standardizes on another browser runner, adds broad component-isolation needs, or CI constraints make Playwright browser installation impractical.
