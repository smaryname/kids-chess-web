export type Color = 'white' | 'black';
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Square = `${string}${number}`;

export interface Piece {
  color: Color;
  type: PieceType;
}

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
  castle?: boolean;
  enPassant?: boolean;
}

export type GameOutcome =
  | { type: 'playing' }
  | { type: 'check'; color: Color }
  | { type: 'checkmate'; winner: Color }
  | { type: 'stalemate' };

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface PositionOptions {
  turn?: Color;
  castlingRights?: Partial<CastlingRights>;
  enPassantTarget?: Square | null;
}

const files = 'abcdefgh';
const other = (color: Color): Color => color === 'white' ? 'black' : 'white';
const key = (file: number, rank: number): Square => `${files[file]}${rank + 1}`;
const coords = (square: Square): [number, number] => [files.indexOf(square[0]), Number(square[1]) - 1];
const valid = (file: number, rank: number) => file >= 0 && file < 8 && rank >= 0 && rank < 8;

const noCastling: CastlingRights = {
  whiteKingSide: false,
  whiteQueenSide: false,
  blackKingSide: false,
  blackQueenSide: false,
};

export class ChessGame {
  private board = new Map<Square, Piece>();
  turn: Color = 'white';
  castlingRights: CastlingRights = { ...noCastling };
  enPassantTarget: Square | null = null;
  outcome: GameOutcome = { type: 'playing' };

  constructor(startingPosition = true) {
    if (startingPosition) {
      this.castlingRights = {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      };
      this.setupStartingPosition();
      this.updateOutcome();
    }
  }

  static fromPosition(position: Record<string, Piece>, options: PositionOptions = {}) {
    const game = new ChessGame(false);
    for (const [square, piece] of Object.entries(position)) game.board.set(square as Square, { ...piece });
    game.turn = options.turn ?? 'white';
    game.castlingRights = { ...noCastling, ...options.castlingRights };
    game.enPassantTarget = options.enPassantTarget ?? null;
    game.updateOutcome();
    return game;
  }

  clone() {
    const game = new ChessGame(false);
    game.board = new Map([...this.board].map(([square, piece]) => [square, { ...piece }]));
    game.turn = this.turn;
    game.castlingRights = { ...this.castlingRights };
    game.enPassantTarget = this.enPassantTarget;
    game.outcome = { ...this.outcome };
    return game;
  }

  restart() {
    const fresh = new ChessGame();
    this.board = fresh.board;
    this.turn = fresh.turn;
    this.castlingRights = fresh.castlingRights;
    this.enPassantTarget = fresh.enPassantTarget;
    this.outcome = fresh.outcome;
  }

  pieceAt(square: Square) { return this.board.get(square); }
  pieces() { return new Map(this.board); }

  legalMoves(from: Square): Move[] {
    const piece = this.board.get(from);
    if (!piece || piece.color !== this.turn) return [];
    return this.pseudoMoves(from, true).filter((move) => {
      const copy = this.clone();
      copy.applyUnchecked(move);
      return !copy.isKingInCheck(piece.color);
    });
  }

  allLegalMoves(color: Color = this.turn): Move[] {
    const copy = this.clone();
    copy.turn = color;
    return [...copy.board.keys()].flatMap((square) => copy.legalMoves(square));
  }

  move(from: Square, to: Square, promotion: PieceType = 'queen') {
    if (this.outcome.type === 'checkmate' || this.outcome.type === 'stalemate') return false;
    const selected = this.legalMoves(from).find((move) => move.to === to);
    if (!selected) return false;
    const piece = this.board.get(from)!;
    const [, toRank] = coords(to);
    if (piece.type === 'pawn' && (toRank === 0 || toRank === 7)) {
      if (!['queen', 'rook', 'bishop', 'knight'].includes(promotion)) return false;
      selected.promotion = promotion;
    }
    this.applyUnchecked(selected);
    this.turn = other(this.turn);
    this.updateOutcome();
    return true;
  }

  isKingInCheck(color: Color) {
    const king = [...this.board].find(([, piece]) => piece.color === color && piece.type === 'king')?.[0];
    return !king || this.isSquareAttacked(king, other(color));
  }

  isSquareAttacked(square: Square, attacker: Color) {
    for (const [origin, piece] of this.board) {
      if (piece.color !== attacker) continue;
      if (piece.type === 'pawn') {
        const [file, rank] = coords(origin);
        const direction = attacker === 'white' ? 1 : -1;
        if ([key(file - 1, rank + direction), key(file + 1, rank + direction)].includes(square)) return true;
      } else if (this.pseudoMoves(origin, false).some((move) => move.to === square)) {
        return true;
      }
    }
    return false;
  }

  private setupStartingPosition() {
    const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let file = 0; file < 8; file += 1) {
      this.board.set(key(file, 0), { color: 'white', type: backRank[file] });
      this.board.set(key(file, 1), { color: 'white', type: 'pawn' });
      this.board.set(key(file, 6), { color: 'black', type: 'pawn' });
      this.board.set(key(file, 7), { color: 'black', type: backRank[file] });
    }
  }

  private pseudoMoves(from: Square, includeCastling: boolean): Move[] {
    const piece = this.board.get(from);
    if (!piece) return [];
    switch (piece.type) {
      case 'pawn': return this.pawnMoves(from, piece.color);
      case 'knight': return this.jumpMoves(from, piece.color, [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]);
      case 'bishop': return this.slidingMoves(from, piece.color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      case 'rook': return this.slidingMoves(from, piece.color, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      case 'queen': return this.slidingMoves(from, piece.color, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
      case 'king': {
        const moves = this.jumpMoves(from, piece.color, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
        return includeCastling ? [...moves, ...this.castleMoves(piece.color)] : moves;
      }
    }
  }

  private pawnMoves(from: Square, color: Color) {
    const [file, rank] = coords(from);
    const direction = color === 'white' ? 1 : -1;
    const startRank = color === 'white' ? 1 : 6;
    const moves: Move[] = [];
    const one = key(file, rank + direction);
    if (valid(file, rank + direction) && !this.board.has(one)) {
      moves.push({ from, to: one });
      const two = key(file, rank + direction * 2);
      if (rank === startRank && !this.board.has(two)) moves.push({ from, to: two });
    }
    for (const offset of [-1, 1]) {
      const targetFile = file + offset;
      const targetRank = rank + direction;
      if (!valid(targetFile, targetRank)) continue;
      const to = key(targetFile, targetRank);
      const captured = this.board.get(to);
      if (captured && captured.color !== color) moves.push({ from, to });
      else if (to === this.enPassantTarget) {
        const adjacent = this.board.get(key(targetFile, rank));
        if (adjacent?.type === 'pawn' && adjacent.color === other(color)) moves.push({ from, to, enPassant: true });
      }
    }
    return moves;
  }

  private jumpMoves(from: Square, color: Color, offsets: number[][]) {
    const [file, rank] = coords(from);
    return offsets.flatMap(([df, dr]) => {
      if (!valid(file + df, rank + dr)) return [];
      const to = key(file + df, rank + dr);
      return this.board.get(to)?.color === color ? [] : [{ from, to }];
    });
  }

  private slidingMoves(from: Square, color: Color, directions: number[][]) {
    const [file, rank] = coords(from);
    const moves: Move[] = [];
    for (const [df, dr] of directions) {
      let targetFile = file + df;
      let targetRank = rank + dr;
      while (valid(targetFile, targetRank)) {
        const to = key(targetFile, targetRank);
        const occupant = this.board.get(to);
        if (occupant) {
          if (occupant.color !== color) moves.push({ from, to });
          break;
        }
        moves.push({ from, to });
        targetFile += df;
        targetRank += dr;
      }
    }
    return moves;
  }

  private castleMoves(color: Color) {
    const rank = color === 'white' ? 0 : 7;
    const from = key(4, rank);
    if (this.pieceAt(from)?.type !== 'king' || this.isKingInCheck(color)) return [];
    const moves: Move[] = [];
    const kingSide = color === 'white' ? this.castlingRights.whiteKingSide : this.castlingRights.blackKingSide;
    if (kingSide && this.samePiece(key(7, rank), color, 'rook') && !this.board.has(key(5, rank)) && !this.board.has(key(6, rank)) && !this.isSquareAttacked(key(5, rank), other(color)) && !this.isSquareAttacked(key(6, rank), other(color))) {
      moves.push({ from, to: key(6, rank), castle: true });
    }
    const queenSide = color === 'white' ? this.castlingRights.whiteQueenSide : this.castlingRights.blackQueenSide;
    if (queenSide && this.samePiece(key(0, rank), color, 'rook') && !this.board.has(key(1, rank)) && !this.board.has(key(2, rank)) && !this.board.has(key(3, rank)) && !this.isSquareAttacked(key(3, rank), other(color)) && !this.isSquareAttacked(key(2, rank), other(color))) {
      moves.push({ from, to: key(2, rank), castle: true });
    }
    return moves;
  }

  private samePiece(square: Square, color: Color, type: PieceType) {
    const piece = this.board.get(square);
    return piece?.color === color && piece.type === type;
  }

  private applyUnchecked(move: Move) {
    const piece = this.board.get(move.from);
    if (!piece) return;
    const [fromFile, fromRank] = coords(move.from);
    const [toFile, toRank] = coords(move.to);
    this.board.delete(move.from);
    this.enPassantTarget = null;
    if (move.enPassant) this.board.delete(key(toFile, fromRank));
    if (move.castle) {
      const rookFrom = key(toFile === 6 ? 7 : 0, fromRank);
      const rookTo = key(toFile === 6 ? 5 : 3, fromRank);
      const rook = this.board.get(rookFrom);
      if (rook) { this.board.delete(rookFrom); this.board.set(rookTo, rook); }
    }
    if (piece.type === 'pawn' && Math.abs(toRank - fromRank) === 2) this.enPassantTarget = key(fromFile, (fromRank + toRank) / 2);
    this.updateCastlingRights(piece, move.from, move.to);
    this.board.set(move.to, move.promotion ? { color: piece.color, type: move.promotion } : piece);
  }

  private updateCastlingRights(piece: Piece, from: Square, capturedAt: Square) {
    if (piece.type === 'king') {
      if (piece.color === 'white') { this.castlingRights.whiteKingSide = false; this.castlingRights.whiteQueenSide = false; }
      else { this.castlingRights.blackKingSide = false; this.castlingRights.blackQueenSide = false; }
    }
    const corners: [Square, keyof CastlingRights][] = [
      ['a1', 'whiteQueenSide'], ['h1', 'whiteKingSide'], ['a8', 'blackQueenSide'], ['h8', 'blackKingSide'],
    ];
    for (const [corner, right] of corners) if (from === corner || capturedAt === corner) this.castlingRights[right] = false;
  }

  private updateOutcome() {
    const hasMoves = this.allLegalMoves(this.turn).length > 0;
    const inCheck = this.isKingInCheck(this.turn);
    if (hasMoves) this.outcome = inCheck ? { type: 'check', color: this.turn } : { type: 'playing' };
    else this.outcome = inCheck ? { type: 'checkmate', winner: other(this.turn) } : { type: 'stalemate' };
  }
}

export const pieceSymbol = ({ color, type }: Piece) => {
  const symbols: Record<Color, Record<PieceType, string>> = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
  };
  return symbols[color][type];
};

export const boardSquares = Array.from({ length: 64 }, (_, index) => {
  const row = Math.floor(index / 8);
  const file = index % 8;
  return key(file, 7 - row);
});
