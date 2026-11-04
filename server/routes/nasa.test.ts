import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnv } from "../env";
import { explainPicture } from "../lib/gemini";
import { getPictures } from "../lib/nasa";
import { ProviderError } from "../lib/providers";
import { createAdminClient } from "../lib/supabase";
import { nasa } from "./nasa";

vi.mock("../lib/gemini", () => ({ explainPicture: vi.fn() }));
vi.mock("../lib/nasa", () => ({ getPictures: vi.fn() }));
vi.mock("../lib/supabase", () => ({ createAdminClient: vi.fn() }));

const picture = {
  date: "2014-09-18",
  title: "Cocoon",
  explanation: "A nebula.",
  image_url: "https://example.com/image.jpg",
};
const explanation = {
  title_he: "ערפילית",
  summary_he: "זהו ענן גדול בחלל. בתוכו נוצרים כוכבים חדשים.",
  tags: ["nebula"] as ["nebula"],
};
let rows: Map<string, Record<string, unknown>>;

beforeEach(() => {
  vi.resetAllMocks();
  rows = new Map();
  vi.mocked(getPictures).mockResolvedValue([picture]);
  vi.mocked(explainPicture).mockResolvedValue(explanation);
  const db = {
    from: () => {
      let action = "read";
      let values: Record<string, unknown> = {};
      let date = "";
      const query = {
        select: () => query,
        eq: (column: string, value: string) => {
          if (column === "date") date = value;
          return query;
        },
        insert: (input: Record<string, unknown>) => {
          action = "insert";
          values = input;
          date = input.date as string;
          return query;
        },
        update: (input: Record<string, unknown>) => {
          action = "update";
          values = input;
          return query;
        },
        maybeSingle: () => query,
        single: () => query,
        then: (resolve: (value: unknown) => unknown) => {
          if (action === "insert" && rows.has(date))
            return Promise.resolve(
              resolve({ data: null, error: { code: "23505" } }),
            );
          if (action === "insert")
            rows.set(date, {
              date,
              status: "pending",
              title_he: null,
              summary_he: null,
              tags: null,
            });
          if (action === "update")
            rows.set(date, { ...rows.get(date), ...values });
          return Promise.resolve(
            resolve({ data: rows.get(date) ?? null, error: null }),
          );
        },
      };
      return query;
    },
  };
  vi.mocked(createAdminClient).mockReturnValue(
    db as unknown as ReturnType<typeof createAdminClient>,
  );
});

function request(body: unknown = { date: picture.date }) {
  const app = new Hono<AppEnv>().route("/nasa", nasa);
  return app.request(
    "/nasa/explanations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { NASA_API_KEY: "test", GEMINI_API_KEY: "test" },
  );
}

describe("explanation cache", () => {
  it("returns a saved answer without calling either provider again", async () => {
    expect((await request()).status).toBe(200);
    const cached = await request();
    expect(cached.status).toBe(200);
    expect(await cached.json()).toMatchObject({ ...explanation, cached: true });
    expect(explainPicture).toHaveBeenCalledTimes(1);
    expect(getPictures).toHaveBeenCalledTimes(1);
  });

  it("lets only one concurrent request generate an explanation", async () => {
    let finish!: (value: typeof explanation) => void;
    vi.mocked(explainPicture).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = request();
    await vi.waitFor(() => expect(explainPicture).toHaveBeenCalledTimes(1));
    expect((await request()).status).toBe(409);
    finish(explanation);
    expect((await first).status).toBe(200);
    expect(explainPicture).toHaveBeenCalledTimes(1);
  });

  it("does not generate again after a provider timeout", async () => {
    vi.mocked(explainPicture).mockRejectedValue(
      new ProviderError(504, "provider_timeout", "Gemini took too long."),
    );
    expect((await request()).status).toBe(504);
    expect((await request()).status).toBe(503);
    expect(explainPicture).toHaveBeenCalledTimes(1);
  });

  it("rejects browser-supplied source text and invalid dates", async () => {
    expect(
      (await request({ date: picture.date, title: "hacked" })).status,
    ).toBe(400);
    expect((await request({ date: "2026-02-30" })).status).toBe(400);
    expect(explainPicture).not.toHaveBeenCalled();
  });
});
