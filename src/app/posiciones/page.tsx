import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NavBar } from "@/components/NavBar";
import { getLeaderboard } from "@/lib/quiniela";
import { formatPoints } from "@/lib/matches";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { rows, totalMatches, resolvedMatches } = await getLeaderboard();
  const leader = rows[0]?.points ?? 0;

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-pitch">
            Tabla de posiciones
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Clasificación general
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {resolvedMatches} de {totalMatches} partidos definidos.
          </p>
          <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Puntos:</span>
            <span>1 por acertar al ganador</span>
            <span className="text-slate-300">·</span>
            <span>
              <span className="font-semibold text-pitch">+0.5</span> si aciertas
              que ganó en penales
            </span>
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            Aún no hay participantes con pronósticos.
          </div>
        ) : (
          <ol className="space-y-1.5">
            {rows.map((r, i) => {
              const isMe = r.userId === session.user.id;
              const rank = i + 1;
              return (
                <li
                  key={r.userId}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                    isMe
                      ? "border-pitch/40 bg-emerald-50/60"
                      : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  <RankBadge rank={rank} />

                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {r.image ? (
                      <Image
                        src={r.image}
                        alt={r.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center text-sm font-semibold text-slate-400">
                        {initial(r.name)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {r.name}
                      {isMe && (
                        <span className="ml-1.5 rounded bg-pitch/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pitch">
                          Tú
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.filled}/{totalMatches} pronósticos
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-lg font-bold leading-none text-slate-900">
                      {formatPoints(r.points)}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      pts
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const styles = [
      "bg-amber-100 text-amber-700 ring-amber-200",
      "bg-slate-100 text-slate-600 ring-slate-200",
      "bg-orange-100 text-orange-700 ring-orange-200",
    ][rank - 1];
    return (
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${styles}`}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-sm font-semibold text-slate-400">
      {rank}
    </span>
  );
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
