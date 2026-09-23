/* oxlint-disable typescript/no-floating-promises */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ChessGame, type Color, type PieceType, type Square } from '../lib/chess.ts';

const piece = (color: Color, type: PieceType) => ({ color, type });
const sq = (value: string) => value as Square;

test('en passant expires after one reply', () => {
  const game = new ChessGame();
  game.move(sq('e2'), sq('e4'));
  game.move(sq('a7'), sq('a6'));
  game.move(sq('e4'), sq('e5'));
  game.move(sq('d7'), sq('d5'));
  game.move(sq('h2'), sq('h3'));
  game.move(sq('a6'), sq('a5'));
  assert.equal(game.move(sq('e5'), sq('d6')), false);
});

test('queen-side castling moves king and rook', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), a1: piece('white', 'rook'), e8: piece('black', 'king'),
  }, { castlingRights: { whiteQueenSide: true } });
  assert.equal(game.move(sq('e1'), sq('c1')), true);
  assert.deepEqual(game.pieceAt(sq('c1')), piece('white', 'king'));
  assert.deepEqual(game.pieceAt(sq('d1')), piece('white', 'rook'));
});

test('castling is denied while the path is blocked', () => {
  const game = new ChessGame();
  assert.equal(game.legalMoves(sq('e1')).some((move) => move.to === 'g1' || move.to === 'c1'), false);
});

test('castling rights are lost after the king moves away and back', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), h1: piece('white', 'rook'), e8: piece('black', 'king'),
  }, { castlingRights: { whiteKingSide: true } });
  game.move(sq('e1'), sq('e2'));
  game.move(sq('e8'), sq('e7'));
  game.move(sq('e2'), sq('e1'));
  game.move(sq('e7'), sq('e8'));
  assert.equal(game.move(sq('e1'), sq('g1')), false);
});

test('castling rights are lost after that rook moves away and back', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), h1: piece('white', 'rook'), e8: piece('black', 'king'),
  }, { castlingRights: { whiteKingSide: true } });
  game.move(sq('h1'), sq('h2'));
  game.move(sq('e8'), sq('e7'));
  game.move(sq('h2'), sq('h1'));
  game.move(sq('e7'), sq('e8'));
  assert.equal(game.move(sq('e1'), sq('g1')), false);
});

test('castling into check is denied', () => {
  const game = ChessGame.fromPosition({
    e1: piece('white', 'king'), h1: piece('white', 'rook'),
    a8: piece('black', 'king'), g8: piece('black', 'rook'),
  }, { castlingRights: { whiteKingSide: true } });
  assert.equal(game.move(sq('e1'), sq('g1')), false);
});

test('supports underpromotion to every non-queen option', () => {
  for (const promoted of ['rook', 'bishop', 'knight'] as PieceType[]) {
    const game = ChessGame.fromPosition({
      e1: piece('white', 'king'), e8: piece('black', 'king'), a7: piece('white', 'pawn'),
    });
    assert.equal(game.move(sq('a7'), sq('a8'), promoted), true);
    assert.deepEqual(game.pieceAt(sq('a8')), piece('white', promoted));
  }
});

test('known genuine stalemate has no legal moves and is not check', () => {
  const game = ChessGame.fromPosition({
    a8: piece('black', 'king'), c6: piece('white', 'king'), b6: piece('white', 'queen'),
  }, { turn: 'black' });
  assert.equal(game.isKingInCheck('black'), false);
  assert.equal(game.allLegalMoves('black').length, 0);
  assert.deepEqual(game.outcome, { type: 'stalemate' });
});
