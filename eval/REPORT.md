# Kids Chess Web — Milestones 1 and 2 evaluation report

**Run date:** 2026-09-23  
**Environment:** Production static export, Chromium desktop and Pixel 7 mobile profiles

## Results

- 24 engine and coaching tests passed
- 22 browser scenarios passed
- 0 failed, skipped, or flaky tests
- Production build completed successfully before browser execution

## Milestone 1 requirements

| Requirement | Evidence | Result |
|---|---|---|
| Kid-friendly 8×8 board and standard setup | Desktop/mobile render checks | Pass |
| Selection and legal destination highlights | Real click and class-state checks | Pass |
| Legal moves, alternating turns, illegal-move prevention | Engine and browser checks | Pass |
| Captures | Engine and real-click browser checks | Pass |
| Check and checkmate | Engine checks and complete Fool’s Mate UI flow | Pass |
| Stalemate | Engine position check | Pass |
| Castling | Both sides plus blocked, attacked, and lost-rights cases | Pass |
| En passant | Immediate capture and expiry cases | Pass |
| Promotion | Queen and underpromotion cases plus browser choice dialog | Pass |
| Restart and turn status | Desktop/mobile browser checks | Pass |

## Milestone 2 requirements

| Requirement | Evidence | Result |
|---|---|---|
| Written move coaching | Capture and general feedback checks | Pass |
| “Help Me” suggestions | Legal deterministic suggestion tests and board highlighting | Pass |
| Optional spoken coaching | Accessible opt-in toggle on desktop/mobile | Pass |
| Lightweight celebrations | Capture celebration browser check | Pass |

## Architecture and privacy

The chess rules and coaching evaluator execute under Node without React or a DOM. Coaching remains deterministic and local. The app requires no backend, account, analytics, generative AI, or network chess service.

## Known limitations

- Native speech voice and pronunciation vary by browser and device.
- “Help Me” gives a friendly legal idea; it is not a full chess-engine analysis.
- Draws by repetition, the 50-move rule, and insufficient material remain outside the current milestones.
