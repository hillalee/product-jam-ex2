import { z } from "zod";

export const tags = [
  "galaxy",
  "planet",
  "nebula",
  "earth",
  "sun",
  "moon",
  "star",
  "spaceflight",
] as const;
export const apodDateSchema = z.iso
  .date()
  .refine(
    (date) =>
      date >= "1995-06-16" && date <= new Date().toISOString().slice(0, 10),
    "Choose an APOD date from June 16, 1995 through today.",
  );
export const picturesQuerySchema = z.strictObject({
  count: z.coerce.number().int().min(1).max(20).default(20),
});
export const explanationInputSchema = z.strictObject({ date: apodDateSchema });
export const pictureSchema = z.object({
  date: apodDateSchema,
  title: z.string().trim().min(1),
  image_url: z.url().refine((url) => url.startsWith("https://")),
  explanation: z.string().trim().min(1),
  copyright: z.string().optional(),
});
export const hebrewExplanationSchema = z.strictObject({
  title_he: z.string().trim().min(1).max(200).regex(/[א-ת]/),
  summary_he: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .regex(/[א-ת]/)
    .refine((text) => {
      const sentences = text
        .split(/[.!?]+/)
        .filter((sentence) => sentence.trim());
      return sentences.length >= 2 && sentences.length <= 3;
    }, "The explanation must contain two or three sentences."),
  tags: z
    .array(z.enum(tags))
    .min(1)
    .max(5)
    .refine((items) => new Set(items).size === items.length),
});
export const explanationSchema = hebrewExplanationSchema.extend({
  date: apodDateSchema,
  cached: z.boolean(),
});
export type Picture = z.infer<typeof pictureSchema>;
export type HebrewExplanation = z.infer<typeof hebrewExplanationSchema>;
export type Explanation = z.infer<typeof explanationSchema>;
