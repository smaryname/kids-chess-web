/* oxlint-disable typescript/no-floating-promises */
import test from 'node:test';
import assert from 'node:assert/strict';
import { coachMessageForMove, suggestMove } from '../lib/coach.ts';
import { ChessGame, type Color, type PieceType, type Square } from '../lib/chess.ts';

const piece = (color: Color, type: PieceType) => ({ color, type });
const sq = (value: string) => value as Square;

test('suggests a legal, deterministic opening move', () => {
  const game = new ChessGame();
  const first = suggestMove(game);
  const second = suggestMove(game);
  assert.ok(first);
  assert.deepEqual(first, second);
  assert.equal(game.legalMoves(first.move.from).some((move) => move.to === first.move.to), true);
});

test('prioritizes a checkmating move', () => {
  const game = ChessGame.fromPosition({
    f6: piece('white', 'king'), g6: piece('white', 'queen'), h8: piece('black', 'king'),
  });
  const suggestion = suggestMove(game);
  assert.ok(suggestion);
  const next = game.clone();
  assert.equal(next.move(suggestion.move.from, suggestion.move.to, suggestion.move.promotion), true);
  assert.equal(next.outcome.type, 'checkmate');
  assert.match(suggestion.message, /checkmate/i);
});

test('explains captures in child-friendly language', () => {
  const before = ChessGame.fromPosition({
    e1: piece('white', 'king'), e8: piece('black', 'king'), d4: piece('white', 'pawn'), e5: piece('black', 'pawn'),
  });
  const move = before.legalMoves(sq('d4')).find((candidate) => candidate.to === 'e5');
  assert.ok(move);
  const after = before.clone();
  after.move(move.from, move.to);
  assert.match(coachMessageForMove(before, move, after), /capture|took/i);
});
