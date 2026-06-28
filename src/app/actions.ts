"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTournament } from "@/lib/quiniela";

const VALID_CHOICES = new Set(["A", "B", "X"]);
const VALID_RESULTS = new Set(["A", "B", "X", ""]);

// ── Usuario: guardar sus pronósticos ────────────────────────────
export async function savePredictions(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "No autenticado." };

  const tournament = await getTournament();
  if (tournament.isClosed) {
    return { ok: false, error: "La quiniela está cerrada." };
  }

  const userId = session.user.id;
  const validMatchIds = new Set(tournament.matches.map((m) => m.id));

  const ops = [];
  for (const m of tournament.matches) {
    const raw = formData.get(`match_${m.id}`);
    const choice = typeof raw === "string" ? raw : "";
    if (!choice) continue; // sin elección: lo dejamos sin pronóstico
    if (!VALID_CHOICES.has(choice) || !validMatchIds.has(m.id)) continue;
    ops.push(
      prisma.prediction.upsert({
        where: { userId_matchId: { userId, matchId: m.id } },
        create: { userId, matchId: m.id, choice },
        update: { choice },
      }),
    );
  }

  await prisma.$transaction(ops);
  revalidatePath("/");
  revalidatePath("/posiciones");
  return { ok: true };
}

// ── Admin: registrar el resultado de un partido ─────────────────
export async function setMatchResult(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.isAdmin) return;

  const matchId = String(formData.get("matchId") ?? "");
  const result = String(formData.get("result") ?? "");
  if (!matchId || !VALID_RESULTS.has(result)) return;

  await prisma.match.update({
    where: { id: matchId },
    data: { result: result === "" ? null : result },
  });

  revalidatePath("/admin");
  revalidatePath("/posiciones");
  revalidatePath("/");
}

// ── Admin: abrir / cerrar la quiniela ───────────────────────────
export async function setTournamentClosed(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.isAdmin) return;

  const closed = String(formData.get("closed") ?? "") === "true";
  const tournament = await getTournament();
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { isClosed: closed },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/posiciones");
}
