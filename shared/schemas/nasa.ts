import { z } from "zod";

export const TAGS = [
  "galaxy",
  "planet",
  "nebula",
  "star",
  "moon",
  "sun",
  "earth",
  "spaceflight",
] as const;

/** A NASA picture, as the API returns it. */
export type Picture = {
  date: string;
  title: string;
  explanation: string;
  image_url: string;
};

/** The browser sends only the picture's date. */
export const explainPictureSchema = z.object({
  date: z.iso.date(),
});

/** The answer Gemini must give. */
export const hebrewExplanationSchema = z.object({
  title_he: z.string().min(1),
  summary_he: z.string().min(1),
  tags: z.array(z.enum(TAGS)).min(1).max(5),
});

/** A saved explanation, as the API returns it. */
export const explanationSchema = hebrewExplanationSchema.extend({
  date: z.string(),
});

export type HebrewExplanation = z.infer<typeof hebrewExplanationSchema>;
export type Explanation = z.infer<typeof explanationSchema>;
