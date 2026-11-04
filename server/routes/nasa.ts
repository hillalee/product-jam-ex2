import {
  explanationInputSchema,
  hebrewExplanationSchema,
  picturesQuerySchema,
} from "@shared/schemas/nasa";
import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { explainPicture } from "../lib/gemini";
import { getPictures } from "../lib/nasa";
import { ProviderError } from "../lib/providers";
import { createAdminClient } from "../lib/supabase";

const columns = "date, status, title_he, summary_he, tags";

function savedResponse(
  c: Context<AppEnv>,
  row: { date: string; status: string },
) {
  if (row.status === "pending")
    return fail(
      c,
      409,
      "explanation_pending",
      "This explanation is still being generated. Check again in a moment.",
    );
  if (row.status === "failed")
    return fail(
      c,
      503,
      "explanation_failed",
      "An explanation is not available for this picture. Try another picture.",
    );
  const parsed = hebrewExplanationSchema.strip().safeParse(row);
  if (!parsed.success)
    return fail(
      c,
      500,
      "database_error",
      "The saved explanation could not be read.",
    );
  return c.json({ date: row.date, ...parsed.data, cached: true });
}

export const nasa = new Hono<AppEnv>()
  .get("/pictures", validate("query", picturesQuerySchema), async (c) => {
    try {
      return c.json(
        await getPictures(c.env.NASA_API_KEY, c.req.valid("query")),
      );
    } catch (error) {
      if (error instanceof ProviderError)
        return fail(c, error.status, error.code, error.message);
      throw error;
    }
  })
  .post(
    "/explanations",
    validate("json", explanationInputSchema),
    async (c) => {
      const { date } = c.req.valid("json");
      const db = createAdminClient(c.env);
      const existing = await db
        .from("apod_explanations")
        .select(columns)
        .eq("date", date)
        .maybeSingle();
      if (existing.error)
        return fail(
          c,
          500,
          "database_error",
          "Could not check the saved explanations.",
        );
      if (existing.data) return savedResponse(c, existing.data);
      if (!c.env.GEMINI_API_KEY)
        return fail(
          c,
          503,
          "not_configured",
          "Hebrew explanations are not configured yet.",
        );

      try {
        const [picture] = await getPictures(c.env.NASA_API_KEY, { date });
        const reserved = await db.from("apod_explanations").insert({ date });
        if (reserved.error) {
          if (reserved.error.code !== "23505")
            return fail(
              c,
              500,
              "database_error",
              "Could not reserve this explanation.",
            );
          const winner = await db
            .from("apod_explanations")
            .select(columns)
            .eq("date", date)
            .single();
          if (winner.error)
            return fail(
              c,
              500,
              "database_error",
              "Could not check this explanation.",
            );
          return savedResponse(c, winner.data);
        }

        let explanation;
        try {
          explanation = await explainPicture(c.env.GEMINI_API_KEY, picture);
        } catch (error) {
          await db
            .from("apod_explanations")
            .update({ status: "failed" })
            .eq("date", date)
            .eq("status", "pending");
          throw error;
        }
        const saved = await db
          .from("apod_explanations")
          .update({ status: "ready", ...explanation })
          .eq("date", date)
          .eq("status", "pending")
          .select("date")
          .single();
        if (saved.error)
          return fail(
            c,
            500,
            "database_error",
            "The explanation was generated but could not be saved. It will not be generated again automatically.",
          );
        return c.json({ date, ...explanation, cached: false });
      } catch (error) {
        if (error instanceof ProviderError)
          return fail(c, error.status, error.code, error.message);
        throw error;
      }
    },
  );
