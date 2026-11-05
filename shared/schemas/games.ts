import { z } from "zod";

/** A saved game, as the API returns it. */
export const savedGameSchema = z.object({
  id: z.string(),
  result: z.enum(["X", "O", "draw"]),
  created_at: z.string(),
});

/** What the page sends to save a game. */
export const createGameSchema = z.object({
  moves: z.array(z.number()),
});

export type SavedGame = z.infer<typeof savedGameSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
