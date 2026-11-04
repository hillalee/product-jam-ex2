import { afterEach, describe, expect, it, vi } from "vitest";
import { explainPicture } from "./gemini";
import { getPictures } from "./nasa";
import { providerJson } from "./providers";

afterEach(() => vi.unstubAllGlobals());
const picture = {
  date: "2014-09-18",
  title: "Cocoon",
  explanation: "A nebula.",
  image_url: "https://example.com/image.jpg",
};

describe("NASA", () => {
  it("filters videos, unsafe URLs and repeated dates", async () => {
    const source = { ...picture, url: picture.image_url, media_type: "image" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json([
          source,
          source,
          { ...source, media_type: "video" },
          {
            ...source,
            date: "2014-09-19",
            url: "javascript:alert(1)",
            hdurl: "http://example.com/image",
          },
        ]),
      ),
    );
    expect(await getPictures("test", { count: 1 })).toEqual([picture]);
  });

  it("uses the documented dated feed when NASA returns its logo", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json([
          {
            ...picture,
            media_type: "image",
            url: "https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png",
          },
        ]),
      )
      .mockResolvedValueOnce(
        Response.json({
          ...picture,
          media_type: "image",
          url: "https://science.nasa.gov/apod",
          hdurl: picture.image_url,
          explanation: "<b>A nebula.</b>",
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await getPictures("test", { count: 1 })).toEqual([picture]);
    expect(String(fetcher.mock.calls[1][0])).toContain("apod-basic/140918");
  });

  it("turns a rejected NASA key into a safe gateway error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private provider details", { status: 403 }),
        ),
    );
    await expect(getPictures("wrong", { count: 1 })).rejects.toMatchObject({
      status: 502,
      code: "provider_error",
    });
  });

  it.each([
    "https://assets.science.nasa.gov/dynamicimage/assets/science/astro/programs/cosmic-origins/images/misc/news-thumbnail.png?w=594",
    "https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png",
    "",
  ])("skips a replacement that still has no real picture", async (hdurl) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json([
            {
              ...picture,
              media_type: "image",
              url: "https://science.nasa.gov/nasa-logo.png",
            },
          ]),
        )
        .mockResolvedValueOnce(
          Response.json({
            ...picture,
            media_type: "image",
            url: "https://science.nasa.gov/image-article/apod-example/",
            hdurl,
          }),
        ),
    );
    expect(await getPictures("test", { count: 1 })).toEqual([]);
  });

  it("keeps available random pictures when one migrated date is missing", async () => {
    const logo =
      "https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json([
            { ...picture, media_type: "image", url: logo },
            {
              ...picture,
              date: "2014-09-19",
              media_type: "image",
              url: picture.image_url,
            },
          ]),
        )
        .mockResolvedValueOnce(new Response("Not found", { status: 404 })),
    );
    expect(await getPictures("test", { count: 2 })).toEqual([
      { ...picture, date: "2014-09-19" },
    ]);
  });

  it("returns a timeout error when a provider is aborted", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("aborted")));
    await expect(
      providerJson("https://example.com", "NASA", {
        signal: AbortSignal.abort(),
      }),
    ).rejects.toMatchObject({ status: 504 });
  });
});

describe("Gemini output", () => {
  it.each([
    "not json",
    JSON.stringify({
      title_he: "חלל",
      summary_he: "יש כוכבים. הם מאירים.",
      tags: ["hacked"],
    }),
    JSON.stringify({
      title_he: "Space",
      summary_he: "One sentence.",
      tags: ["star"],
    }),
    JSON.stringify({
      title_he: "חלל",
      summary_he: "יש כוכבים. הם מאירים.",
      tags: ["star", "star"],
    }),
  ])("rejects malformed or invalid structured output", async (text) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          candidates: [
            { finishReason: "STOP", content: { parts: [{ text }] } },
          ],
        }),
      ),
    );
    await expect(explainPicture("test", picture)).rejects.toMatchObject({
      status: 502,
      code: "invalid_gemini_output",
    });
  });
});
