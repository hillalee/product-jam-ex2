import type { Explanation, Picture } from "@shared/schemas/nasa";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export function usePictures() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["nasa", "pictures", user?.id],
    queryFn: ({ signal }) =>
      api<Picture[]>("/api/nasa/pictures?count=6", { signal }),
    staleTime: Infinity,
    retry: false,
  });
}

export function useExplanation() {
  return useMutation({
    mutationFn: (date: string) =>
      api<Explanation>("/api/nasa/explanations", {
        method: "POST",
        body: { date },
      }),
    retry: false,
  });
}
