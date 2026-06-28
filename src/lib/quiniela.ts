import { prisma } from "@/lib/prisma";
import { SEED_MATCHES, TOURNAMENT_NAME, scoreFor } from "@/lib/matches";
import type { Match, Tournament } from "@prisma/client";

export type TournamentWithMatches = Tournament & { matches: Match[] };

// Devuelve el torneo activo, creándolo (con sus partidos) la primera vez.
export async function getTournament(): Promise<TournamentWithMatches> {
  const existing = await prisma.tournament.findFirst({
    include: { matches: { orderBy: { order: "asc" } } },
  });
  if (existing) return existing;

  await prisma.tournament.create({
    data: {
      name: TOURNAMENT_NAME,
      matches: {
        create: SEED_MATCHES.map((m, i) => ({
          order: i,
          teamA: m.teamA,
          teamB: m.teamB,
        })),
      },
    },
  });

  // Volvemos a leer con los partidos ordenados.
  return prisma.tournament.findFirstOrThrow({
    include: { matches: { orderBy: { order: "asc" } } },
  });
}

// Pronósticos de un usuario indexados por matchId.
export async function getUserPredictionMap(
  userId: string,
): Promise<Record<string, string>> {
  const preds = await prisma.prediction.findMany({ where: { userId } });
  const map: Record<string, string> = {};
  for (const p of preds) map[p.matchId] = p.choice;
  return map;
}

export type LeaderboardRow = {
  userId: string;
  name: string;
  image: string | null;
  points: number;
  played: number; // partidos con resultado registrado
  filled: number; // pronósticos hechos por el usuario
};

// Calcula la tabla de posiciones: 1 punto por acierto.
export async function getLeaderboard(): Promise<{
  rows: LeaderboardRow[];
  totalMatches: number;
  resolvedMatches: number;
}> {
  const tournament = await getTournament();
  const resultByMatch: Record<string, string | null> = {};
  for (const m of tournament.matches) resultByMatch[m.id] = m.result;
  const resolvedMatches = tournament.matches.filter((m) => m.result).length;

  const users = await prisma.user.findMany({
    include: { predictions: true },
  });

  const rows: LeaderboardRow[] = users
    .map((u) => {
      let points = 0;
      let played = 0;
      for (const p of u.predictions) {
        const result = resultByMatch[p.matchId];
        if (!result) continue;
        played += 1;
        points += scoreFor(p.choice, result);
      }
      return {
        userId: u.id,
        name: u.name ?? u.email ?? "Jugador",
        image: u.image,
        points,
        played,
        filled: u.predictions.length,
      };
    })
    // Solo mostramos usuarios que hayan participado (llenado algo).
    .filter((r) => r.filled > 0)
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return {
    rows,
    totalMatches: tournament.matches.length,
    resolvedMatches,
  };
}
