import { Hono } from "hono";
import type { ApiError } from "@shared/index";
import type { AppEnv } from "./env";
import { fail } from "./lib/errors";
import { requireAuth } from "./middleware/auth";
import { events } from "./routes/events";
import { games } from "./routes/games";
import { health } from "./routes/health";
import { me } from "./routes/me";
import { nasa } from "./routes/nasa";
import { uploads } from "./routes/uploads";

const app = new Hono<AppEnv>();

app.route("/api/health", health);

app.use("/api/*", requireAuth);

app.route("/api/me", me);
app.route("/api/events", events);
app.route("/api/games", games);
app.route("/api/nasa", nasa);
app.route("/api/uploads", uploads);

app.all("/api/*", (c) =>
  fail(c, 404, "not_found", "There is no such address on the server."),
);

app.onError((err, c) => {
  console.error(err);
  return fail(c, 500, "internal_error", "Something went wrong on the server.");
});

export type { ApiError };

export default app;
