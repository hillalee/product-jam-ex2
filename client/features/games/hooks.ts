import type { CreateGameInput, Game } from "@shared/schemas/games";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export function useGames() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["games", user?.id],
    queryFn: () => api<Game[]>("/api/games"),
  });
}

export function useSaveGame() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGameInput) =>
      api<Game>("/api/games", { method: "POST", body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["games", user?.id] });
    },
  });
}
