export type Player = "X" | "O";
export type Result = Player | "draw";
export type GameState = {
  board: (Player | null)[];
  turn: Player;
  result: Result | null;
  winningCells: number[];
};

export function replayGame(moves: readonly number[]): GameState {
  const board: GameState["board"] = Array(16).fill(null);
  let turn: Player = "X";
  let result: Result | null = null;
  let winningCells: number[] = [];

  for (const move of moves) {
    if (result) throw new Error("The game has already ended.");
    if (!Number.isInteger(move) || move < 0 || move >= 16) {
      throw new Error("Choose a cell on the board.");
    }
    if (board[move]) throw new Error("That cell is already occupied.");
    board[move] = turn;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
          [1, 1],
          [1, -1],
        ]) {
          const endRow = row + dr * 2;
          const endCol = col + dc * 2;
          if (endRow < 0 || endRow > 3 || endCol < 0 || endCol > 3) continue;
          const cells = [0, 1, 2].map((n) => (row + dr * n) * 4 + col + dc * n);
          if (cells.every((cell) => board[cell] === turn)) {
            result = turn;
            winningCells = cells;
          }
        }
      }
    }
    if (!result && board.every(Boolean)) result = "draw";
    turn = turn === "X" ? "O" : "X";
  }
  return { board, turn, result, winningCells };
}
