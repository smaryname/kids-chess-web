# Kids Chess Club

A delightful, local two-player chess game for children ages 4–8. It runs entirely in the browser with no accounts, backend, analytics, advertising, or third-party game services.

## Milestone 1

- Standard chess setup and alternating turns
- Legal move highlighting and illegal-move prevention
- Captures, check, checkmate, and stalemate
- Castling, en passant, and choice-based pawn promotion
- Responsive touch, mouse, and keyboard-friendly board
- New-game action and clear turn status

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

The chess rules live in `lib/chess.ts` and do not depend on React. The interface consumes that domain model through `components/kids-chess-game.tsx`.
