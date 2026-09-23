/* oxlint-disable typescript/no-floating-promises */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ChessGame, type Color, type PieceType, type Square } from '../lib/chess.ts';

const piece = (color: Color, type: PieceType) => ({ color, type });
const sq = (value: string) => value as Square;

test('starts with the standard position and alternates turns', () => {
  const game = new ChessGame();
  assert.equal(game.pieces().size, 32);
  assert.equal(game.move(sq('e2'), sq('e4')), true);
  assert.deepEqual(game.pieceAt(sq('e4')), piece('white', 'pawn'));
  assert.equal(game.turn, 'black');
});

test('rejects illegal movement without changing the turn', () => {
  const game = new ChessGame();
  assert.equal(game.move(sq('e2'), sq('e5')), false);
  assert.deepEqual(game.pieceAt(sq('e2')), piece('white', 'pawn'));
  assert.equal(game.turn, 'white');
});

test('supports captures', () => {
  const game = new ChessGame();
  game.move(sq('e2'), sq('e4'));
  game.move(sq('d7'), sq('d5'));
  assert.equal(game.move(sq('e4'), sq('d5')), true);
  assert.deepEqual(game.pieceAt(sq('d5')), piece('white', 'pawn'));
  assert.equal(game.pieceAt(sq('e4')), undefined);
});

test('detects check', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), e8: piece('black', 'king'), e7: piece('white', 'rook'),
  }, { turn: 'black' });
  assert.deepEqual(game.outcome, { type: 'check', color: 'black' });
});

test('detects checkmate in Fool’s Mate', () => {
  const game = new ChessGame();
  game.move(sq('f2'), sq('f3'));
  game.move(sq('e7'), sq('e5'));
  game.move(sq('g2'), sq('g4'));
  game.move(sq('d8'), sq('h4'));
  assert.deepEqual(game.outcome, { type: 'checkmate', winner: 'black' });
});

test('detects stalemate', () => {
  const game = ChessGame.fromPosition({
    a8: piece('black', 'king'), c6: piece('white', 'king'), b6: piece('white', 'queen'),
  }, { turn: 'black' });
  assert.deepEqual(game.outcome, { type: 'stalemate' });
});

test('castles king-side and moves the rook', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), h1: piece('white', 'rook'), e8: piece('black', 'king'),
  }, { castlingRights: { whiteKingSide: true } });
  assert.equal(game.move(sq('e1'), sq('g1')), true);
  assert.deepEqual(game.pieceAt(sq('g1')), piece('white', 'king'));
  assert.deepEqual(game.pieceAt(sq('f1')), piece('white', 'rook'));
  assert.equal(game.pieceAt(sq('h1')), undefined);
});

test('does not castle through an attacked square', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), h1: piece('white', 'rook'), e8: piece('black', 'king'), f8: piece('black', 'rook'),
  }, { castlingRights: { whiteKingSide: true } });
  assert.equal(game.legalMoves(sq('e1')).some((move) => move.to === 'g1'), false);
});

test('supports an immediate en passant capture', () => {
  const game = new ChessGame();
  game.move(sq('e2'), sq('e4'));
  game.move(sq('a7'), sq('a6'));
  game.move(sq('e4'), sq('e5'));
  game.move(sq('d7'), sq('d5'));
  assert.equal(game.move(sq('e5'), sq('d6')), true);
  assert.deepEqual(game.pieceAt(sq('d6')), piece('white', 'pawn'));
  assert.equal(game.pieceAt(sq('d5')), undefined);
});

test('promotes a pawn to the chosen piece', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), e8: piece('black', 'king'), a7: piece('white', 'pawn'),
  });
  assert.equal(game.move(sq('a7'), sq('a8'), 'knight'), true);
  assert.deepEqual(game.pieceAt(sq('a8')), piece('white', 'knight'));
});

test('a pinned piece cannot expose its king', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), e2: piece('white', 'rook'), e8: piece('black', 'rook'), a8: piece('black', 'king'),
  });
  assert.equal(game.legalMoves(sq('e2')).some((move) => move.to === 'd2'), false);
});
