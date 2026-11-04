import { pictureSchema, apodDateSchema } from "@shared/schemas/nasa";
import type { Picture } from "@shared/schemas/nasa";
import { z } from "zod";
import { ProviderError, providerJson } from "./providers";

const sourceSchema = z.object({
  date: apodDateSchema,
  title: z.string(),
  explanation: z.string(),
  media_type: z.string(),
  url: z.string(),
  hdurl: z.string().optional(),
  copyright: z.string().optional(),
});

function isPlaceholder(url: string) {
  return /nasa[-_]logo|\/misc\/news-thumbnail\./i.test(url);
}

function plainText(text: string) {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(?:amp|quot|apos|lt|gt|nbsp);/g,
      (entity) =>
        ({
          "&amp;": "&",
          "&quot;": '"',
          "&apos;": "'",
          "&lt;": "<",
          "&gt;": ">",
          "&nbsp;": " ",
        })[entity] ?? entity,
    )
    .replace(/\s+/g, " ")
    .trim();
}

export async function getPictures(
  key: string,
  query: { count: number } | { date: string },
): Promise<Picture[]> {
  if (!key)
    throw new ProviderError(
      503,
      "not_configured",
      "NASA pictures are not configured yet.",
    );
  const signal = AbortSignal.timeout(30_000);
  const url = new URL("https://api.nasa.gov/planetary/apod");
  url.searchParams.set("api_key", key);
  for (const [name, value] of Object.entries(query))
    url.searchParams.set(name, String(value));
  const payload = await providerJson(url, "NASA", { signal });
  const parsed = z
    .array(sourceSchema)
    .safeParse(Array.isArray(payload) ? payload : [payload]);
  if (!parsed.success)
    throw new ProviderError(
      502,
      "invalid_nasa_data",
      "NASA returned picture data we could not read.",
    );

  const resolved = await Promise.allSettled(
    parsed.data.map(async (source) => {
      if (!isPlaceholder(source.url) && !isPlaceholder(source.hdurl ?? ""))
        return source;
      const dateCode = source.date.replaceAll("-", "").slice(2);
      const replacement = sourceSchema.safeParse(
        await providerJson(
          `https://science.nasa.gov/wp-json/wp/v2/apod-basic/${dateCode}`,
          "NASA",
          { signal },
        ),
      );
      if (!replacement.success || replacement.data.date !== source.date)
        throw new ProviderError(
          502,
          "invalid_nasa_data",
          "NASA could not return the requested picture.",
        );
      return replacement.data;
    }),
  );
  const sources = resolved.flatMap((entry) =>
    entry.status === "fulfilled" ? [entry.value] : [],
  );
  const failed = resolved.find((entry) => entry.status === "rejected");
  if (
    failed?.status === "rejected" &&
    ("date" in query || sources.length === 0)
  )
    throw failed.reason;
  const pictures: Picture[] = [];
  for (const source of sources) {
    if (source.media_type !== "image") continue;
    const imageUrl = source.hdurl || source.url;
    if (
      isPlaceholder(imageUrl) ||
      (imageUrl === source.url &&
        source.url.includes("science.nasa.gov/image-article/"))
    )
      continue;
    const picture = pictureSchema.safeParse({
      date: source.date,
      title: plainText(source.title),
      explanation: plainText(source.explanation),
      image_url: imageUrl,
      ...(source.copyright ? { copyright: plainText(source.copyright) } : {}),
    });
    if (
      picture.success &&
      !pictures.some((item) => item.date === picture.data.date)
    )
      pictures.push(picture.data);
  }
  if (
    "date" in query &&
    (!pictures.length || pictures[0].date !== query.date)
  ) {
    throw new ProviderError(
      400,
      "not_a_picture",
      "This date does not have a usable APOD image.",
    );
  }
  return "count" in query ? pictures.slice(0, query.count) : pictures;
}
