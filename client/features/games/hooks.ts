import type { CreateGameInput, SavedGame } from "@shared/schemas/games";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

const GAMES_KEY = ["games"];

/**
 * Loads the user's saved games, newest first.
 * Returns the games query.
 */
export function useGames() {
  return useQuery({
    queryKey: GAMES_KEY,
    queryFn: () => api<SavedGame[]>("/api/games"),
  });
}

export function useSaveGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGameInput) =>
      api<SavedGame>("/api/games", { method: "POST", body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GAMES_KEY });
    },
  });
}
