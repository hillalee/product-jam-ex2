import { replayGame } from "@shared/game";
import { createGameSchema } from "@shared/schemas/games";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { createAdminClient } from "../lib/supabase";

const columns = "id, moves, result, created_at";

export const games = new Hono<AppEnv>()
  .get("/", async (c) => {
    const { data, error } = await createAdminClient(c.env)
      .from("games")
      .select(columns)
      .eq("owner_id", c.get("user").id)
      .order("created_at", { ascending: false });
    if (error)
      return fail(c, 500, "database_error", "Could not load your games.");
    return c.json(data);
  })
  .post("/", validate("json", createGameSchema), async (c) => {
    const { moves } = c.req.valid("json");
    let result;
    try {
      result = replayGame(moves).result;
    } catch (error) {
      return fail(c, 400, "invalid_game", (error as Error).message);
    }
    if (!result)
      return fail(c, 400, "invalid_game", "The game is not finished.");

    const { data, error } = await createAdminClient(c.env)
      .from("games")
      .insert({ moves, result, owner_id: c.get("user").id })
      .select(columns)
      .single();
    if (error)
      return fail(c, 500, "database_error", "Could not save this game.");
    return c.json(data, 201);
  });
