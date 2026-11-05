import type { Picture } from "@shared/schemas/nasa";
import { z } from "zod";

const APOD_API_URL = "https://api.nasa.gov/planetary/apod";

const SCIENCE_APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

const TIMEOUT_MS = 45_000;

const randomDatesSchema = z.array(z.object({ date: z.string() }));

const sciencePictureSchema = z.object({
  date: z.string(),
  title: z.string(),
  explanation: z.string(),
  media_type: z.string(),
  hdurl: z.string().optional(),
});

/**
 * Gets random pictures from NASA.
 * Takes the API key and a count, returns the pictures or null.
 */
export async function getRandomPictures(
  apiKey: string,
  count: number,
): Promise<Picture[] | null> {
  const url = `${APOD_API_URL}?api_key=${apiKey}&count=${count}`;
  const dates = randomDatesSchema.safeParse(await fetchJson(url));
  if (!dates.success) {
    return null;
  }

  const pictures = await Promise.all(
    dates.data.map((item) => getPicture(item.date)),
  );
  return pictures.filter((picture) => picture !== null);
}

/**
 * Gets one picture from NASA's science site.
 * Takes a date (YYYY-MM-DD), returns the picture or null.
 */
export async function getPicture(date: string): Promise<Picture | null> {
  const dayCode = date.slice(2).replaceAll("-", "");
  const picture = sciencePictureSchema.safeParse(
    await fetchJson(`${SCIENCE_APOD_URL}/${dayCode}`),
  );

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
 * Fetches JSON, giving up after TIMEOUT_MS.
 * Takes a URL, returns the JSON or null.
 */
async function fetchJson(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}
