import { InvalidMoveError, replayGame } from "@shared/game";
import { createGameSchema } from "@shared/schemas/games";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { createAdminClient } from "../lib/supabase";

const COLUMNS = "id, result, created_at";

export const games = new Hono<AppEnv>()
  .get("/", async (c) => {
    const { data, error } = await createAdminClient(c.env)
      .from("games")
      .select(COLUMNS)
      .eq("owner_id", c.get("user").id)
      .order("created_at", { ascending: false });

    if (error) {
      return fail(c, 500, "database_error", "Could not load your games.");
    }
    return c.json(data);
  })

  .post("/", validate("json", createGameSchema), async (c) => {
    const { moves } = c.req.valid("json");

    let game;
    try {
      game = replayGame(moves);
    } catch (error) {
      if (error instanceof InvalidMoveError) {
        return fail(c, 400, "invalid_move", error.message);
      }
      throw error;
    }
    if (game.result === null) {
      return fail(c, 400, "game_not_over", "The game is not over yet.");
    }

    const { data, error } = await createAdminClient(c.env)
      .from("games")
      .insert({ moves, result: game.result, owner_id: c.get("user").id })
      .select(COLUMNS)
      .single();

    if (error) {
      return fail(c, 500, "database_error", "Could not save the game.");
    }
    return c.json(data, 201);
  });
