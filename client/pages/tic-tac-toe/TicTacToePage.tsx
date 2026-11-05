import { playMove, replayGame, type Game } from "@shared/game";
import type { SavedGame } from "@shared/schemas/games";
import { useState } from "react";
import { Button } from "../../components";
import { useGames, useSaveGame } from "../../features/games/hooks";
import styles from "./TicTacToePage.module.css";

export default function TicTacToePage() {
  const [moves, setMoves] = useState<number[]>([]);
  const game = replayGame(moves);
  const saveGame = useSaveGame();

  function handleCellClick(cell: number) {
    const nextGame = playMove(game, cell);
    const nextMoves = [...moves, cell];
    setMoves(nextMoves);
    if (nextGame.result !== null) {
      saveGame.mutate({ moves: nextMoves });
    }
  }

  return (
    <main>
      <h1>Tic-tac-toe</h1>
      <p className={styles.status}>{getStatusText(game)}</p>

      <div className={styles.board}>
        {game.board.map((player, cell) => (
          <button
            key={cell}
            type="button"
            className={styles.cell}
            disabled={player !== null || game.result !== null}
            onClick={() => handleCellClick(cell)}
          >
            {player}
          </button>
        ))}
      </div>

      {saveGame.isError ? <p>{saveGame.error.message}</p> : null}
      <Button onClick={() => setMoves([])}>New game</Button>

      <h2>My games</h2>
      <GameHistory />
    </main>
  );
}

function GameHistory() {
  const games = useGames();

  if (games.isPending) {
    return <p>Loading games...</p>;
  }
  if (games.isError) {
    return <p>{games.error.message}</p>;
  }
  if (games.data.length === 0) {
    return <p>No games yet.</p>;
  }
  return (
    <ul>
      {games.data.map((savedGame) => (
        <li key={savedGame.id}>
          {getResultText(savedGame)},{" "}
          {new Date(savedGame.created_at).toLocaleString()}
        </li>
      ))}
    </ul>
  );
}

function getStatusText(game: Game) {
  if (game.result === "draw") {
    return "It's a draw!";
  }
  if (game.result !== null) {
    return `${game.result} wins!`;
  }
  return `${game.turn}'s turn`;
}

function getResultText(savedGame: SavedGame) {
  if (savedGame.result === "draw") {
    return "Draw";
  }
  return `${savedGame.result} won`;
}
