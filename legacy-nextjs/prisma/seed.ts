import { PrismaClient } from "@prisma/client";
import { SEED_MATCHES, TOURNAMENT_NAME } from "../src/lib/matches";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.tournament.findFirst();
  if (existing) {
    console.log(`Ya existe un torneo ("${existing.name}"). No se hace nada.`);
    return;
  }

  const tournament = await prisma.tournament.create({
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

  console.log(
    `Torneo creado: "${tournament.name}" con ${SEED_MATCHES.length} partidos.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
