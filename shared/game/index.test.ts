import { describe, expect, it } from "vitest";
import { createGame, playMove, replayGame } from "./index";

describe("big-three rules", () => {
  it("lets X win with three across", () => {
    expect(replayGame([0, 4, 1, 5, 2]).result).toBe("X");
  });

  it("lets O win with three on a diagonal", () => {
    expect(replayGame([0, 3, 1, 6, 15, 9]).result).toBe("O");
  });

  it("does not count a line that wraps to the next row", () => {
    expect(replayGame([2, 8, 3, 9, 4]).result).toBeNull();
  });

  it("ends in a draw when the board is full", () => {
    const moves = [0, 2, 1, 3, 6, 4, 7, 5, 8, 10, 9, 11, 14, 12, 15, 13];
    expect(replayGame(moves).result).toBe("draw");
  });

  it("does not change the game it gets", () => {
    const game = createGame();
    playMove(game, 0);
    expect(game.board[0]).toBeNull();
  });

  it("rejects wrong moves", () => {
    expect(() => replayGame([0, 0])).toThrow("already taken");
    expect(() => replayGame([16])).toThrow("not on the board");
    expect(() => replayGame([0, 4, 1, 5, 2, 6])).toThrow("already over");
  });
});
