import { ChessGame, type Move, type Piece, type PieceType } from './chess.ts';

export interface MoveSuggestion {
  move: Move;
  message: string;
}

const pieceValues: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

const centralSquares = new Set(['d4', 'e4', 'd5', 'e5']);

export function suggestMove(game: ChessGame): MoveSuggestion | null {
  const choices = game.allLegalMoves().map((move) => scoreMove(game, move));
  choices.sort((left, right) => right.score - left.score || moveKey(left.move).localeCompare(moveKey(right.move)));
  const choice = choices[0];
  if (!choice) return null;
  return { move: choice.move, message: choice.message };
}

export function coachMessageForMove(before: ChessGame, move: Move, after: ChessGame) {
  const movingPiece = before.pieceAt(move.from);
  const capturedPiece = capturedByMove(before, move);
  if (after.outcome.type === 'checkmate') return `Checkmate! ${capitalize(after.outcome.winner)} found the winning move!`;
  if (after.outcome.type === 'stalemate') return 'That made a stalemate. The game is a draw!';
  if (move.promotion) return `Amazing! Your pawn became a ${move.promotion}.`;
  if (move.castle) return 'Great teamwork! The king and rook castled together.';
  if (after.outcome.type === 'check') return 'Check! The other king needs help.';
  if (capturedPiece) return `Nice capture! You took a ${capturedPiece.type}.`;
  if (movingPiece?.type === 'knight') return 'Boing! Knights jump in an L shape.';
  if (centralSquares.has(move.to)) return 'Good thinking! The center is a powerful place.';
  return 'Nice move! Now it is the other team’s turn.';
}

function scoreMove(game: ChessGame, original: Move) {
  const movingPiece = game.pieceAt(original.from);
  const promotion = movingPiece?.type === 'pawn' && (original.to.endsWith('1') || original.to.endsWith('8')) ? 'queen' : original.promotion;
  const move = promotion ? { ...original, promotion } : { ...original };
  const capturedPiece = capturedByMove(game, move);
  const next = game.clone();
  next.move(move.from, move.to, move.promotion);

  let score = 0;
  let message = `Try ${move.from} → ${move.to}. It safely develops your ${movingPiece?.type ?? 'piece'}.`;
  if (centralSquares.has(move.to)) {
    score += 30;
    message = `Try ${move.from} → ${move.to}. The center gives your pieces more room.`;
  }
  if (movingPiece?.type === 'knight' || movingPiece?.type === 'bishop') score += 12;
  if (move.castle) {
    score += 80;
    message = `Try ${move.from} → ${move.to}. Castling helps protect your king.`;
  }
  if (capturedPiece) {
    score += pieceValues[capturedPiece.type] * 100;
    message = `Try ${move.from} → ${move.to}. You can safely capture a ${capturedPiece.type}.`;
  }
  if (move.promotion) {
    score += 900;
    message = `Try ${move.from} → ${move.to}. Your pawn can become a queen!`;
  }
  if (next.outcome.type === 'check') {
    score += 250;
    message = `Try ${move.from} → ${move.to}. This move gives check.`;
  }
  if (next.outcome.type === 'checkmate') {
    score += 10_000;
    message = `Try ${move.from} → ${move.to}. You found checkmate!`;
  }
  return { move, message, score };
}

function capturedByMove(game: ChessGame, move: Move): Piece | undefined {
  if (!move.enPassant) return game.pieceAt(move.to);
  return { color: game.turn === 'white' ? 'black' : 'white', type: 'pawn' };
}

const moveKey = (move: Move) => `${move.from}${move.to}${move.promotion ?? ''}`;
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
