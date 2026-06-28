// Partidos de la quiniela (16avos de final), tomados del Excel original.
// El orden define cómo se muestran en la app.
export const TOURNAMENT_NAME = "Mundial — 16avos de final";

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

export type Choice = "A" | "B" | "X";

export const CHOICE_LABEL: Record<Choice, string> = {
  A: "Gana A",
  B: "Gana B",
  X: "Empate",
};
