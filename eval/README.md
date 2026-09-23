# Milestones 1 and 2 evaluation harness

This harness evaluates the finished Kids Chess web app without changing its chess behavior.

## Coverage

- `../tests/chess.test.ts` — existing headless engine rules
- `engine-edge.test.ts` — castling edge cases, en-passant expiry, underpromotion, and genuine stalemate
- `specs/milestone-1.spec.ts` — real-browser board, selection, highlighting, movement, turns, illegal targets, captures, restart, promotion choice, Fool’s Mate, and a responsive restart-button accessibility check
- `../tests/coach.test.ts` — deterministic legal suggestions and child-friendly explanations
- `specs/milestone-2.spec.ts` — Help Me highlights, coaching feedback, celebrations, and opt-in speech controls

The engine tests import `lib/chess.ts` directly and require no DOM, which doubles as the architecture check that chess rules are independent from React.

## Run

```bash
cd eval
pnpm install --ignore-workspace
pnpm exec playwright install chromium
pnpm test
```

If the application is already running on `http://localhost:3000`, run:

```sh
pnpm run test:e2e:running
```

To target another deployed or preview URL, set `KIDS_CHESS_EVAL_BASE_URL` as well.

By default, `pnpm test` builds and serves the production static export so browser checks match the deployed architecture.

Results are written to `eval/results/` as line output, JSON, an HTML report, traces, screenshots, and videos on failure. Open the report with `pnpm report`.

## Evaluation discipline

- A failing rule test is a finding; do not weaken it to match incorrect behavior.
- Do not add future-feature expectations for rewards, profiles, dashboards, or generative AI.
- Record the milestone requirements as pass or fail in `REPORT.md` after a complete run.
