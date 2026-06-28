"use client";

import { useFormState, useFormStatus } from "react-dom";
import { savePredictions } from "@/app/actions";
import {
  CHOICES_ORDER,
  formatPoints,
  isPenales,
  resultLabel,
  scoreFor,
  winnerOf,
  type Choice,
} from "@/lib/matches";

type MatchView = {
  id: string;
  order: number;
  teamA: string;
  teamB: string;
  result: string | null;
};

type SaveResult = { ok: boolean; error?: string };
const initialState: SaveResult = { ok: false };

export function QuinielaForm({
  matches,
  predictions,
  isClosed,
}: {
  matches: MatchView[];
  predictions: Record<string, string>;
  isClosed: boolean;
}) {
  const [state, formAction] = useFormState(
    async (_prev: SaveResult, formData: FormData): Promise<SaveResult> => {
      return savePredictions(formData);
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <ol className="space-y-2">
        {matches.map((m, idx) => {
          const pick = predictions[m.id];
          const winnerCorrect =
            isClosed && m.result ? winnerOf(pick) === winnerOf(m.result) : false;
          const pts = isClosed ? scoreFor(pick, m.result) : 0;

          return (
            <li
              key={m.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                  {idx + 1}
                </span>
                <span>{m.teamA}</span>
                <span className="text-slate-400">vs</span>
                <span>{m.teamB}</span>
                {isClosed && m.result && (
                  <span className="ml-auto flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      Resultado: {resultLabel(m.result, m.teamA, m.teamB)}
                    </span>
                    <span
                      className={
                        pts > 0
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700"
                          : "rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600"
                      }
                    >
                      +{formatPoints(pts)}
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CHOICES_ORDER.map((c) => {
                  const selected = pick === c;
                  const isExactResult = m.result === c;
                  return (
                    <label
                      key={c}
                      className={cellClass({
                        selected,
                        isClosed,
                        isExactResult,
                        winnerCorrect,
                        hasResult: !!m.result,
                      })}
                    >
                      <input
                        type="radio"
                        name={`match_${m.id}`}
                        value={c}
                        defaultChecked={selected}
                        disabled={isClosed}
                        className="sr-only"
                      />
                      <span className="block text-center">
                        <span className="block text-[11px] uppercase tracking-wide opacity-70">
                          {isPenales(c) ? "En penales" : "Gana"}
                        </span>
                        <span className="block truncate text-xs font-semibold">
                          {choiceTeam(c, m)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {!isClosed ? (
        <SaveBar state={state} />
      ) : (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
          La quiniela está cerrada. Ya no puedes modificar tus pronósticos.
        </p>
      )}
    </form>
  );
}

function SaveBar({ state }: { state: SaveResult }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
      <p className="text-sm text-slate-600">
        {pending
          ? "Guardando…"
          : state.error
            ? `⚠️ ${state.error}`
            : state.ok
              ? "✅ Pronósticos guardados"
              : "Marca tus resultados y guarda."}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-pitch px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-pitchDark disabled:opacity-60"
      >
        Guardar
      </button>
    </div>
  );
}

function choiceTeam(c: Choice, m: MatchView): string {
  return winnerOf(c) === "A" ? m.teamA : m.teamB;
}

function cellClass({
  selected,
  isClosed,
  isExactResult,
  winnerCorrect,
  hasResult,
}: {
  selected: boolean;
  isClosed: boolean;
  isExactResult: boolean;
  winnerCorrect: boolean;
  hasResult: boolean;
}): string {
  const base =
    "cursor-pointer rounded-lg border px-2 py-2 transition select-none";

  if (isClosed) {
    if (selected && hasResult && winnerCorrect)
      return `${base} border-emerald-500 bg-emerald-50 text-emerald-800 cursor-default`;
    if (selected && hasResult && !winnerCorrect)
      return `${base} border-rose-400 bg-rose-50 text-rose-700 cursor-default`;
    if (selected)
      return `${base} border-slate-400 bg-slate-100 text-slate-700 cursor-default`;
    if (isExactResult)
      return `${base} border-emerald-300 bg-emerald-50/50 text-emerald-700 cursor-default`;
    return `${base} border-slate-200 bg-white text-slate-400 cursor-default`;
  }

  if (selected)
    return `${base} border-pitch bg-emerald-50 text-pitchDark ring-1 ring-pitch`;
  return `${base} border-slate-200 bg-white text-slate-600 hover:border-pitch/60 hover:bg-emerald-50/40`;
}
