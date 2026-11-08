import { explainPictureSchema } from "@shared/schemas/nasa";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { explainInHebrew } from "../lib/gemini";
import { getPicture, getRandomPictures } from "../lib/nasa";
import { createAdminClient } from "../lib/supabase";

const PICTURE_COUNT = 20;
const COLUMNS = "date, title_he, summary_he, tags";

export const nasa = new Hono<AppEnv>()
  .get("/pictures", async (c) => {
    const pictures = await getRandomPictures(PICTURE_COUNT);
    if (pictures === null) {
      return fail(
        c,
        502,
        "nasa_error",
        "NASA is not answering right now. Please try again later.",
      );
    }
    return c.json(pictures);
  })

  .post("/explanations", validate("json", explainPictureSchema), async (c) => {
    const { date } = c.req.valid("json");
    const supabase = createAdminClient(c.env);

    const saved = await supabase
      .from("apod_explanations")
      .select(COLUMNS)
      .eq("date", date)
      .maybeSingle();
    if (saved.error) {
      return fail(c, 500, "database_error", "Could not load the explanation.");
    }
    if (saved.data) {
      return c.json(saved.data);
    }

    const picture = await getPicture(date);
    if (picture === null) {
      return fail(
        c,
        502,
        "nasa_error",
        "Could not get this picture from NASA.",
      );
    }

    const explanation = await explainInHebrew(c.env.GEMINI_API_KEY, picture);
    if (explanation === null) {
      return fail(
        c,
        502,
        "gemini_error",
        "Gemini did not give a valid explanation. Please try again.",
      );
    }

    const { data, error } = await supabase
      .from("apod_explanations")
      .insert({ date, ...explanation })
      .select(COLUMNS)
      .single();
    if (error) {
      return fail(c, 500, "database_error", "Could not save the explanation.");
    }
    return c.json(data, 201);
  });
