'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, MessageCircle, RotateCcw, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { coachMessageForMove, suggestMove, type MoveSuggestion } from '@/lib/coach';
import { boardSquares, ChessGame, pieceSymbol, type Move, type PieceType, type Square } from '@/lib/chess';

interface PromotionRequest { from: Square; to: Square }
const promotionChoices: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

export function KidsChessGame() {
  const [game, setGame] = useState(() => new ChessGame());
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<PromotionRequest | null>(null);
  const [coachMessage, setCoachMessage] = useState('Hi! I can explain moves or give you a gentle hint.');
  const [suggestion, setSuggestion] = useState<MoveSuggestion | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const gameRef = useRef(game);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { gameRef.current = game; }, [game]);
  const legalMoves = useMemo(() => selected ? game.legalMoves(selected) : [], [game, selected]);
  const legalDestinations = useMemo(() => new Set(legalMoves.map((move) => move.to)), [legalMoves]);

  const status = game.outcome.type === 'checkmate' ? `Checkmate — ${capitalize(game.outcome.winner)} wins!`
    : game.outcome.type === 'stalemate' ? 'Stalemate — it’s a draw'
    : game.outcome.type === 'check' ? `${capitalize(game.outcome.color)} is in check!`
    : `${capitalize(game.turn)}’s turn`;
  const hint = game.outcome.type === 'playing' ? (suggestion ? 'Coach highlighted a friendly idea' : selected ? 'Choose one of the glowing squares' : 'Pick a piece to begin')
    : game.outcome.type === 'check' ? 'Protect your king' : 'Great game!';

  function tapSquare(square: Square) {
    if (legalDestinations.has(square) && selected) {
      const piece = game.pieceAt(selected)!;
      if (piece.type === 'pawn' && (square.endsWith('1') || square.endsWith('8'))) {
        setPromotion({ from: selected, to: square });
        return;
      }
      playMove(selected, square);
      return;
    }
    setSelected(game.pieceAt(square)?.color === game.turn ? square : null);
    if (square !== suggestion?.move.from) setSuggestion(null);
  }

  function playMove(from: Square, to: Square, promotionPiece?: PieceType) {
    const legalMove = game.legalMoves(from).find((move) => move.to === to);
    if (!legalMove) return;
    const completedMove: Move = promotionPiece ? { ...legalMove, promotion: promotionPiece } : legalMove;
    const isSpecial = Boolean(game.pieceAt(to) || completedMove.enPassant || completedMove.castle || completedMove.promotion);
    const next = game.clone();
    if (next.move(from, to, promotionPiece)) {
      const message = coachMessageForMove(game, completedMove, next);
      setGame(next);
      setCoachMessage(message);
      speak(message);
      if (isSpecial || next.outcome.type === 'check' || next.outcome.type === 'checkmate') celebrate();
    }
    setSelected(null);
    setPromotion(null);
    setSuggestion(null);
  }

  function restart() {
    setGame(new ChessGame());
    setSelected(null);
    setPromotion(null);
    setSuggestion(null);
    setCoachMessage('Fresh board! White gets the first move.');
    window.speechSynthesis?.cancel();
  }

  function askForHelp() {
    const nextSuggestion = suggestMove(game);
    if (!nextSuggestion) {
      setCoachMessage('The game is finished. You both played wonderfully!');
      return;
    }
    setSuggestion(nextSuggestion);
    setSelected(nextSuggestion.move.from);
    setCoachMessage(nextSuggestion.message);
    speak(nextSuggestion.message);
  }

  function toggleVoice() {
    const nextValue = !voiceEnabled;
    setVoiceEnabled(nextValue);
    if (nextValue) speak(coachMessage, true);
    else window.speechSynthesis?.cancel();
  }

  function speak(message: string, force = false) {
    if ((!voiceEnabled && !force) || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.92;
    utterance.pitch = 1.12;
    window.speechSynthesis.speak(utterance);
  }

  function celebrate() {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    setCelebration(true);
    celebrationTimer.current = setTimeout(() => setCelebration(false), 1100);
  }

  const isFinished = game.outcome.type === 'checkmate' || game.outcome.type === 'stalemate';

  useEffect(() => {
    const context = (document as unknown as { modelContext?: WebMCPContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: 'play_chess_move',
        title: 'Play chess move',
        description: 'Move one chess piece on the visible board using algebraic squares such as e2 and e4.',
        inputSchema: {
          type: 'object',
          properties: {
            from: { type: 'string', pattern: '^[a-h][1-8]$' },
            to: { type: 'string', pattern: '^[a-h][1-8]$' },
            promotion: { type: 'string', enum: ['queen', 'rook', 'bishop', 'knight'] },
          },
          required: ['from', 'to'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          const value = input as { from?: string; to?: string; promotion?: PieceType };
          if (!value.from?.match(/^[a-h][1-8]$/) || !value.to?.match(/^[a-h][1-8]$/)) throw new Error('Use valid squares such as e2 and e4.');
          const current = gameRef.current;
          const legalMove = current.legalMoves(value.from as Square).find((move) => move.to === value.to);
          const next = current.clone();
          if (!next.move(value.from as Square, value.to as Square, value.promotion)) throw new Error('That move is not legal in the current position.');
          gameRef.current = next;
          setGame(next);
          setSelected(null);
          setPromotion(null);
          setSuggestion(null);
          if (legalMove) setCoachMessage(coachMessageForMove(current, value.promotion ? { ...legalMove, promotion: value.promotion } : legalMove, next));
          return { moved: `${value.from}-${value.to}`, turn: next.turn, outcome: next.outcome.type };
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'restart_chess_game',
        title: 'Restart chess game',
        description: 'Start a fresh chess game in the standard starting position.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute() {
          const next = new ChessGame();
          gameRef.current = next;
          setGame(next);
          setSelected(null);
          setPromotion(null);
          setSuggestion(null);
          setCoachMessage('Fresh board! White gets the first move.');
          return { restarted: true, turn: next.turn };
        },
      }, { signal: lifecycle.signal });
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  useEffect(() => () => {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    window.speechSynthesis?.cancel();
  }, []);

  return (
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="sunburst" aria-hidden="true" />
      {celebration && <div className="celebration" aria-hidden="true"><span>★</span><span>✦</span><span>★</span><span>✦</span><span>★</span></div>}
      <section className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-3 py-4 sm:px-8 sm:py-7">
        <header className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div>
            <p className="eyebrow"><Sparkles className="size-4" /> Two-player game</p>
            <h1 className="font-heading text-3xl font-black tracking-tight sm:text-5xl">Chess PvsP</h1>
          </div>
          <Button aria-label="New game" onClick={restart} className="h-11 rounded-full bg-white/90 px-4 text-[var(--ink)] shadow-sm hover:bg-white" variant="outline">
            <RotateCcw /> <span className="hidden sm:inline">New game</span>
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="mx-auto w-full max-w-[min(70vh,720px)]">
            <output className={`turn-pill mb-3 ${game.outcome.type === 'check' ? 'check-pill' : ''}`} aria-live="polite">
              <span className={`piece-dot ${game.turn}`}>{game.turn === 'white' ? '♙' : '♟'}</span>
              <span><strong>{status}</strong><small>{hint}</small></span>
            </output>
            <div className="board-shell">
              <div className="board" aria-label="Chess board">
                {boardSquares.map((square, index) => {
                  const piece = game.pieceAt(square);
                  const isSelected = selected === square;
                  const isLegal = legalDestinations.has(square);
                  const isCapture = isLegal && Boolean(piece);
                  const isSuggestedFrom = suggestion?.move.from === square;
                  const isSuggestedTo = suggestion?.move.to === square;
                  const row = Math.floor(index / 8);
                  const col = index % 8;
                  return (
                    <button
                      aria-label={piece ? `${capitalize(piece.color)} ${piece.type} on ${square}` : `Empty square ${square}`}
                      aria-pressed={isSelected}
                      className={`square ${(row + col) % 2 === 0 ? 'light-square' : 'dark-square'} ${isSelected ? 'selected-square' : ''} ${isLegal ? 'legal-square' : ''} ${isCapture ? 'capture-square' : ''} ${isSuggestedFrom ? 'suggested-from' : ''} ${isSuggestedTo ? 'suggested-to' : ''}`}
                      data-square={square}
                      key={square}
                      onClick={() => tapSquare(square)}
                      type="button"
                    >
                      {isLegal && <span className="move-marker" aria-hidden="true" />}
                      {piece && <span className={`chess-piece ${piece.color}`} aria-hidden="true">{pieceSymbol(piece)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="coach-card" aria-label="Chess coach">
            <span className="sticker" aria-hidden="true"><MessageCircle /></span>
            <p className="eyebrow">Friendly coach</p>
            <h2 className="mt-1 font-heading text-2xl font-black">Think it through!</h2>
            <output className="coach-message" aria-live="polite">{coachMessage}</output>
            {suggestion && <p className="suggestion-note"><strong>Coach idea:</strong> {suggestion.move.from} → {suggestion.move.to}</p>}
            <div className="coach-actions">
              <Button aria-label="Help me choose a move" className="help-button" disabled={isFinished} onClick={askForHelp}>
                <Lightbulb /> Help me
              </Button>
              <Button aria-label={voiceEnabled ? 'Turn coach voice off' : 'Turn coach voice on'} className="voice-button" onClick={toggleVoice} variant="outline">
                {voiceEnabled ? <Volume2 /> : <VolumeX />} <span>{voiceEnabled ? 'Voice on' : 'Voice off'}</span>
              </Button>
            </div>
          </aside>
        </div>
      </section>

      <Dialog open={Boolean(promotion)} onOpenChange={(open) => { if (!open) setPromotion(null); }}>
        <DialogContent className="rounded-3xl border-2 p-6" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-black">Your pawn reached the end!</DialogTitle>
            <DialogDescription>Choose its new superpower.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {promotionChoices.map((choice) => (
              <Button className="h-20 rounded-2xl text-lg capitalize" key={choice} onClick={() => promotion && playMove(promotion.from, promotion.to, choice)} variant="outline">
                <span className="text-3xl">{pieceSymbol({ color: game.turn, type: choice })}</span> {choice}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isFinished}>
        <AlertDialogContent className="rounded-3xl border-2">
          <AlertDialogHeader>
            <AlertDialogMedia className="rounded-full bg-[var(--secondary)]"><Trophy /></AlertDialogMedia>
            <AlertDialogTitle className="font-heading text-2xl font-black">{status}</AlertDialogTitle>
            <AlertDialogDescription>You both played a wonderful game.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={restart} className="h-11 rounded-full">Play again</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

interface WebMCPContext {
  registerTool(tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute(input: unknown): unknown;
  }, options: { signal: AbortSignal }): void | Promise<void>;
}
