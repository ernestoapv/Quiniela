import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NavBar } from "@/components/NavBar";
import { getLeaderboard } from "@/lib/quiniela";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { rows, totalMatches, resolvedMatches } = await getLeaderboard();

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Tabla de posiciones
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {resolvedMatches}/{totalMatches} partidos con resultado · 1 punto por
          acierto.
        </p>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
            Todavía no hay participantes con pronósticos.
          </p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Jugador</th>
                  <th className="px-4 py-3 text-center font-semibold">Llenó</th>
                  <th className="px-4 py-3 text-right font-semibold">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => {
                  const isMe = r.userId === session.user.id;
                  return (
                    <tr
                      key={r.userId}
                      className={isMe ? "bg-emerald-50/60" : undefined}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-500">
                        {medal(i)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.image && (
                            <Image
                              src={r.image}
                              alt={r.name}
                              width={28}
                              height={28}
                              className="rounded-full"
                            />
                          )}
                          <span className="font-medium text-slate-800">
                            {r.name}
                            {isMe && (
                              <span className="ml-1 text-xs text-pitch">
                                (tú)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {r.filled}/{totalMatches}
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-pitch">
                        {r.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function medal(index: number): string {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return String(index + 1);
}
