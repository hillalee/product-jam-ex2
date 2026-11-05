import type { Explanation, Picture } from "@shared/schemas/nasa";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function usePictures() {
  return useQuery({
    queryKey: ["nasa-pictures"],
    queryFn: () => api<Picture[]>("/api/nasa/pictures"),
  });
}

/**
 * Asks the server to explain a picture.
 * Takes a date, returns the explanation.
 */
export function useExplainPicture() {
  return useMutation({
    mutationFn: (date: string) =>
      api<Explanation>("/api/nasa/explanations", {
        method: "POST",
        body: { date },
      }),
  });
}
