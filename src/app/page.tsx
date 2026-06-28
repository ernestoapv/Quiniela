import Link from "next/link";
import { auth } from "@/auth";
import { NavBar } from "@/components/NavBar";
import { SignInButton } from "@/components/AuthButtons";
import { QuinielaForm } from "@/components/QuinielaForm";
import { getTournament, getUserPredictionMap } from "@/lib/quiniela";
import { APP_SUBTITLE, formatPoints, scoreFor } from "@/lib/matches";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    return <Landing />;
  }

  const tournament = await getTournament();
  const predictions = await getUserPredictionMap(session.user.id);

  // Puntaje del usuario según resultados ya registrados.
  let points = 0;
  let resolved = 0;
  for (const m of tournament.matches) {
    if (!m.result) continue;
    resolved += 1;
    points += scoreFor(predictions[m.id], m.result);
  }
  const filled = Object.keys(predictions).length;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-pitch">
            {APP_SUBTITLE}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {tournament.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <StatusBadge isClosed={tournament.isClosed} />
            <span>
              {filled}/{tournament.matches.length} pronósticos
            </span>
            {resolved > 0 && (
              <span className="font-semibold text-pitch">
                {formatPoints(points)} {points === 1 ? "punto" : "puntos"} (
                {resolved} jugados)
              </span>
            )}
          </div>
        </div>

        <QuinielaForm
          matches={tournament.matches.map((m) => ({
            id: m.id,
            order: m.order,
            teamA: m.teamA,
            teamB: m.teamB,
            result: m.result,
          }))}
          predictions={predictions}
          isClosed={tournament.isClosed}
        />

        <p className="mt-6 text-center text-sm text-slate-500">
          Mira la{" "}
          <Link href="/posiciones" className="font-medium text-pitch underline">
            tabla de posiciones
          </Link>
          .
        </p>
      </main>
    </>
  );
}

function StatusBadge({ isClosed }: { isClosed: boolean }) {
  return isClosed ? (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      Cerrada
    </span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      Abierta
    </span>
  );
}

function Landing() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-7 bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-4 text-center">
      <div className="text-6xl drop-shadow-sm">⚽</div>
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-pitch">
          {APP_SUBTITLE} · 2026
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Hay que revolverle
        </h1>
        <p className="mt-3 text-slate-600">
          Llena tus pronósticos de los partidos, guárdalos y compite por el
          primer lugar de la tabla. Inicia sesión para empezar.
        </p>
      </div>
      <SignInButton />
      <p className="text-xs text-slate-400">
        1 punto por acertar al ganador · +0.5 si aciertas el penal
      </p>
    </main>
  );
}
