import { z } from "zod";

export const createGameSchema = z.strictObject({
  moves: z
    .array(z.number().int().min(0).max(15))
    .min(5, "A completed game needs at least five moves.")
    .max(16),
});

export const gameSchema = createGameSchema.extend({
  id: z.uuid(),
  result: z.enum(["X", "O", "draw"]),
  created_at: z.iso.datetime({ offset: true }),
});

export type Game = z.infer<typeof gameSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
