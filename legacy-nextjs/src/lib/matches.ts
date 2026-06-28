// Partidos de la quiniela (16avos de final), tomados del Excel original.
// El orden define cómo se muestran en la app.
export const TOURNAMENT_NAME = "Hay que revolverle — Quiniela 2026";
export const APP_BRAND = "Hay que revolverle";
export const APP_SUBTITLE = "16avos de final";

export const SEED_MATCHES: { teamA: string; teamB: string }[] = [
  { teamA: "Sudáfrica", teamB: "Canadá" },
  { teamA: "Brasil", teamB: "Japón" },
  { teamA: "Alemania", teamB: "Paraguay" },
  { teamA: "Países Bajos", teamB: "Marruecos" },
  { teamA: "Costa de Marfil", teamB: "Noruega" },
  { teamA: "Francia", teamB: "Suecia" },
  { teamA: "México", teamB: "Ecuador" },
  { teamA: "Inglaterra", teamB: "Congo" },
  { teamA: "Estados Unidos", teamB: "Bosnia" },
  { teamA: "Bélgica", teamB: "Senegal" },
  { teamA: "España", teamB: "Austria" },
  { teamA: "Portugal", teamB: "Croacia" },
  { teamA: "Suiza", teamB: "Argelia" },
  { teamA: "Australia", teamB: "Egipto" },
  { teamA: "Argentina", teamB: "Cabo Verde" },
  { teamA: "Colombia", teamB: "Ghana" },
];

// Opciones por partido (eliminación, siempre hay un ganador):
//   A  = gana A en tiempo regular
//   B  = gana B en tiempo regular
//   AP = gana A en penales (después de empate)
//   BP = gana B en penales (después de empate)
export type Choice = "A" | "B" | "AP" | "BP";

// Orden de presentación: arriba el tiempo regular, abajo los penales.
export const CHOICES_ORDER: Choice[] = ["A", "B", "AP", "BP"];

export const CHOICE_LABEL: Record<Choice, string> = {
  A: "Gana A",
  B: "Gana B",
  AP: "Gana A en penales",
  BP: "Gana B en penales",
};

// Equipo ganador (A o B) implícito en una opción/resultado.
export function winnerOf(c?: string | null): "A" | "B" | null {
  if (c === "A" || c === "AP") return "A";
  if (c === "B" || c === "BP") return "B";
  return null;
}

// ¿La opción indica que se ganó en penales (después de empate)?
export function isPenales(c?: string | null): boolean {
  return c === "AP" || c === "BP";
}

// Puntaje de un pronóstico contra el resultado real:
//   1 punto  → acertar al equipo ganador (sin importar cómo).
//   +0.5     → además marcaste "en penales" y efectivamente fue en penales
//              (la opción exacta coincide con el resultado).
export function scoreFor(
  prediction?: string | null,
  result?: string | null,
): number {
  if (!result || !prediction) return 0;
  let pts = 0;
  const w = winnerOf(prediction);
  if (w && w === winnerOf(result)) pts += 1;
  if (isPenales(prediction) && prediction === result) pts += 0.5;
  return pts;
}

// Texto del resultado real para mostrar (ej. "Brasil" o "Brasil (penales)").
export function resultLabel(
  result: string | null | undefined,
  teamA: string,
  teamB: string,
): string {
  switch (result) {
    case "A":
      return teamA;
    case "B":
      return teamB;
    case "AP":
      return `${teamA} (penales)`;
    case "BP":
      return `${teamB} (penales)`;
    default:
      return "—";
  }
}

// Formatea puntos permitiendo medios puntos: 2 → "2", 1.5 → "1.5".
export function formatPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
