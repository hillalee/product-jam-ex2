import { replayGame } from "@shared/game";
import { useState } from "react";
import { Button, Card } from "../../components";
import { useGames, useSaveGame } from "../../features/games/hooks";
import styles from "./TicTacToePage.module.css";

export default function TicTacToePage() {
  const [moves, setMoves] = useState<number[]>([]);
  const game = replayGame(moves);
  const history = useGames();
  const save = useSaveGame();

  function play(cell: number) {
    if (game.result || game.board[cell]) return;
    const nextMoves = [...moves, cell];
    setMoves(nextMoves);
    if (replayGame(nextMoves).result) save.mutate({ moves: nextMoves });
  }

  return (
    <main className={styles.page}>
      <h1>Tic-tac-toe</h1>
      <p>Take turns on the same screen. X starts; three in a row wins.</p>
      <Card className={styles.game}>
        <h2 aria-live="polite">
          {game.result === "draw"
            ? "It's a draw"
            : game.result
              ? `${game.result} wins`
              : `${game.turn}'s turn`}
        </h2>
        <div className={styles.board} aria-label="4 by 4 board">
          {game.board.map((player, cell) => (
            <button
              key={cell}
              type="button"
              className={styles.cell}
              data-winning={game.winningCells.includes(cell) || undefined}
              aria-label={`Row ${Math.floor(cell / 4) + 1}, column ${(cell % 4) + 1}: ${player ?? "empty"}`}
              disabled={Boolean(player || game.result)}
              onClick={() => play(cell)}
            >
              {player}
            </button>
          ))}
        </div>
        <div role="status">
          {save.isPending
            ? "Saving game…"
            : save.isSuccess
              ? "Game saved."
              : null}
        </div>
        {save.isError ? (
          <div role="alert">
            <p>{save.error.message}</p>
            <Button variant="secondary" onClick={() => save.mutate({ moves })}>
              Retry saving
            </Button>
          </div>
        ) : null}
        <Button
          variant="secondary"
          disabled={save.isPending}
          onClick={() => {
            setMoves([]);
            save.reset();
          }}
        >
          New game
        </Button>
      </Card>
      <section className={styles.history}>
        <h2>Your games</h2>
        {history.isPending ? (
          <p role="status">Loading games…</p>
        ) : history.isError ? (
          <div role="alert">
            <p>{history.error.message}</p>
            <Button onClick={() => void history.refetch()}>Try again</Button>
          </div>
        ) : history.data.length === 0 ? (
          <p>No saved games yet.</p>
        ) : (
          <ol className={styles.list}>
            {history.data.map((saved) => (
              <li key={saved.id}>
                <strong>
                  {saved.result === "draw" ? "Draw" : `${saved.result} won`}
                </strong>
                <time dateTime={saved.created_at}>
                  {new Date(saved.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
