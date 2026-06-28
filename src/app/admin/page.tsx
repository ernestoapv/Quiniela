import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NavBar } from "@/components/NavBar";
import { getTournament } from "@/lib/quiniela";
import { setMatchResult, setTournamentClosed } from "@/app/actions";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!session.user.isAdmin) redirect("/");

  const tournament = await getTournament();

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Administración
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Cierra la quiniela y registra los resultados de los partidos.
        </p>

        {/* Abrir / cerrar */}
        <section className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              Estado de la quiniela:{" "}
              {tournament.isClosed ? (
                <span className="text-amber-700 dark:text-amber-400">
                  Cerrada
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400">
                  Abierta
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tournament.isClosed
                ? "Los usuarios no pueden modificar sus pronósticos."
                : "Los usuarios pueden editar sus pronósticos."}
            </p>
          </div>
          <form action={setTournamentClosed}>
            <input
              type="hidden"
              name="closed"
              value={(!tournament.isClosed).toString()}
            />
            <button
              type="submit"
              className={
                tournament.isClosed
                  ? "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  : "rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              }
            >
              {tournament.isClosed ? "Reabrir quiniela" : "Cerrar quiniela"}
            </button>
          </form>
        </section>

        {/* Resultados */}
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Resultados de los partidos
          </h2>
          <ol className="space-y-2">
            {tournament.matches.map((m, idx) => (
              <li
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {idx + 1}
                  </span>
                  <span>{m.teamA}</span>
                  <span className="text-slate-400 dark:text-slate-500">vs</span>
                  <span>{m.teamB}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ResultButton
                    matchId={m.id}
                    value="A"
                    label={`Gana ${m.teamA}`}
                    active={m.result === "A"}
                  />
                  <ResultButton
                    matchId={m.id}
                    value="B"
                    label={`Gana ${m.teamB}`}
                    active={m.result === "B"}
                  />
                  <ResultButton
                    matchId={m.id}
                    value="AP"
                    label={`${m.teamA} en penales`}
                    active={m.result === "AP"}
                  />
                  <ResultButton
                    matchId={m.id}
                    value="BP"
                    label={`${m.teamB} en penales`}
                    active={m.result === "BP"}
                  />
                </div>
                <div className="mt-2">
                  <ResultButton
                    matchId={m.id}
                    value=""
                    label="Limpiar resultado"
                    active={!m.result}
                    muted
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}

function ResultButton({
  matchId,
  value,
  label,
  active,
  muted,
}: {
  matchId: string;
  value: string;
  label: string;
  active: boolean;
  muted?: boolean;
}) {
  const cls = active
    ? muted
      ? "border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      : "border-pitch bg-emerald-50 text-pitchDark ring-1 ring-pitch dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500"
    : "border-slate-200 bg-white text-slate-600 hover:border-pitch/60 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-600/60 dark:hover:bg-emerald-950/30";
  return (
    <form action={setMatchResult}>
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="result" value={value} />
      <button
        type="submit"
        className={`w-full rounded-lg border px-2 py-2 text-xs font-medium transition ${cls}`}
      >
        {label}
      </button>
    </form>
  );
}
