export const BOARD_SIZE = 4;
const WIN_LENGTH = 3;

export type Player = "X" | "O";
export type Cell = Player | null;
export type Result = Player | "draw" | null;

export type Game = {
  board: Cell[];
  turn: Player;
  result: Result;
};

/** Thrown when a move breaks the rules. */
export class InvalidMoveError extends Error {}

const DIRECTIONS = [
  { rowStep: 0, columnStep: 1 },
  { rowStep: 1, columnStep: 0 },
  { rowStep: 1, columnStep: 1 },
  { rowStep: 1, columnStep: -1 },
];

/**
 * Creates an empty game, X plays first.
 * Returns the new game.
 */
export function createGame(): Game {
  return {
    board: Array<Cell>(BOARD_SIZE * BOARD_SIZE).fill(null),
    turn: "X",
    result: null,
  };
}

/**
 * Plays one move without changing the game.
 * Takes a game and a cell (0-15), returns the new game.
 */
export function playMove(game: Game, cell: number): Game {
  if (game.result !== null) {
    throw new InvalidMoveError("The game is already over.");
  }
  if (!Number.isInteger(cell) || cell < 0 || cell >= game.board.length) {
    throw new InvalidMoveError("This cell is not on the board.");
  }
  if (game.board[cell] !== null) {
    throw new InvalidMoveError("This cell is already taken.");
  }

  const board = [...game.board];
  board[cell] = game.turn;

  return {
    board,
    turn: game.turn === "X" ? "O" : "X",
    result: getResult(board, game.turn),
  };
}

/**
 * Plays all moves from an empty board.
 * Takes the moves, returns the final game.
 */
export function replayGame(moves: number[]): Game {
  let game = createGame();
  for (const cell of moves) {
    game = playMove(game, cell);
  }
  return game;
}

/**
 * Checks if the last move ended the game.
 * Takes the board and last player, returns the result.
 */
function getResult(board: Cell[], lastPlayer: Player): Result {
  if (hasWon(board, lastPlayer)) {
    return lastPlayer;
  }
  if (board.every((cell) => cell !== null)) {
    return "draw";
  }
  return null;
}

function hasWon(board: Cell[], player: Player): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let column = 0; column < BOARD_SIZE; column++) {
      for (const direction of DIRECTIONS) {
        if (isLineFrom(board, player, row, column, direction)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Checks for a winning line from one cell.
 * Takes the board, player, start cell and direction, returns true or false.
 */
function isLineFrom(
  board: Cell[],
  player: Player,
  row: number,
  column: number,
  direction: { rowStep: number; columnStep: number },
): boolean {
  for (let step = 0; step < WIN_LENGTH; step++) {
    const lineRow = row + step * direction.rowStep;
    const lineColumn = column + step * direction.columnStep;
    if (!isOnBoard(lineRow, lineColumn)) {
      return false;
    }
    if (board[lineRow * BOARD_SIZE + lineColumn] !== player) {
      return false;
    }
  }
  return true;
}

function isOnBoard(row: number, column: number): boolean {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}
