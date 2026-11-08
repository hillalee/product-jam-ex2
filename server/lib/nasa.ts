import type { Picture } from "@shared/schemas/nasa";
import { z } from "zod";

const APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

const TIMEOUT_MS = 15_000;

const pictureSchema = z.object({
  date: z.string(),
  title: z.string(),
  explanation: z.string(),
  media_type: z.string(),
  hdurl: z.string().optional(),
});

/**
 * Gets random pictures from NASA.
 * Takes a count, returns the pictures or null.
 */
export async function getRandomPictures(
  count: number,
): Promise<Picture[] | null> {
  const probe = await fetchNasa(`${APOD_URL}?per_page=1`);
  const total = Number(probe?.headers.get("X-WP-Total"));
  if (!Number.isInteger(total) || total < count) {
    return null;
  }

  const page = 1 + Math.floor(Math.random() * Math.floor(total / count));
  const response = await fetchNasa(
    `${APOD_URL}?per_page=${count}&page=${page}`,
  );
  const items = z.array(z.unknown()).safeParse(await readJson(response));
  if (!items.success) {
    return null;
  }

  return items.data
    .map((item) => toPicture(item))
    .filter((picture) => picture !== null);
}

/**
 * Gets one picture from NASA.
 * Takes a date (YYYY-MM-DD), returns the picture or null.
 */
export async function getPicture(date: string): Promise<Picture | null> {
  const dayCode = date.slice(2).replaceAll("-", "");
  const response = await fetchNasa(`${APOD_URL}/${dayCode}`);
  return toPicture(await readJson(response));
}

/**
 * Turns one NASA item into a picture.
 * Takes the item, returns the picture, or null if it is not a real image.
 */
function toPicture(item: unknown): Picture | null {
  const picture = pictureSchema.safeParse(item);
  if (!picture.success || picture.data.media_type !== "image") {
    return null;
  }
  const imageUrl = picture.data.hdurl;
  if (!imageUrl || imageUrl.includes("news-thumbnail")) {
    return null;
  }

  return {
    date: picture.data.date,
    title: picture.data.title,
    explanation: removeHtml(picture.data.explanation),
    image_url: imageUrl,
  };
}

/**
 * Removes HTML and the "Explanation:" prefix.
 * Takes NASA's text, returns plain text.
 */
function removeHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace("Explanation:", "")
    .trim();
}

/**
 * Fetches a URL, giving up after TIMEOUT_MS.
 * Takes a URL, returns the response or null if it failed.
 */
async function fetchNasa(url: string): Promise<Response | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

/**
 * Reads a response as JSON.
 * Takes a response or null, returns the JSON or null.
 */
async function readJson(response: Response | null): Promise<unknown> {
  try {
    return response ? await response.json() : null;
  } catch {
    return null;
  }
}
