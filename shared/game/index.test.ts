import { describe, expect, it } from "vitest";
import { replayGame } from "./index";

describe("big-three", () => {
  it.each([
    [0, 4, 1, 5, 2],
    [1, 4, 2, 5, 3],
    [0, 1, 4, 2, 8],
    [0, 1, 5, 2, 10],
    [3, 0, 6, 1, 9],
    [5, 0, 10, 1, 15],
  ])("recognizes a winning line: %j", (...moves) => {
    expect(replayGame(moves).result).toBe("X");
  });

  it("recognizes O winning", () => {
    expect(replayGame([0, 4, 1, 5, 8, 6]).result).toBe("O");
  });

  it("does not wrap a line around a row", () => {
    expect(replayGame([2, 8, 3, 9, 4]).result).toBeNull();
  });

  it("recognizes a full-board draw", () => {
    expect(
      replayGame([5, 9, 14, 0, 10, 4, 3, 2, 8, 15, 1, 7, 12, 13, 11, 6]).result,
    ).toBe("draw");
  });

  it("counts a win on the last cell before considering a draw", () => {
    expect(
      replayGame([2, 12, 9, 3, 7, 8, 13, 0, 4, 14, 1, 10, 6, 11, 15, 5]).result,
    ).toBe("O");
  });

  it.each([-1, 16, 1.5, NaN])("rejects invalid cell %s", (cell) => {
    expect(() => replayGame([cell])).toThrow("Choose a cell");
  });

  it("rejects occupied cells and moves after a win", () => {
    expect(() => replayGame([0, 0])).toThrow("occupied");
    expect(() => replayGame([0, 4, 1, 5, 2, 8])).toThrow("already ended");
  });

  it("keeps unfinished games playable without mutating moves", () => {
    const moves = Object.freeze([0, 4]);
    expect(replayGame(moves)).toMatchObject({ result: null, turn: "X" });
    expect(moves).toEqual([0, 4]);
  });
});
