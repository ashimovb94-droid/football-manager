import { prisma } from '../db.js';
import { simulateMatch } from './matchEngine.js';
import { applyMatchFatigue, dailyRecovery } from './fitness.js';

const CUP_ROUND_NAMES: Record<number, string> = {
  1: 'Раунд 1',
  2: 'Раунд 2',
  3: '1/8 финала',
  4: '1/4 финала',
  5: 'Полуфинал',
  6: 'Финал',
};

const CUP_ROUND_DAYS = [7, 14, 21, 28, 33, 37];

export async function simulateNextCupRound(competitionId: string) {
  const next = await prisma.fixture.findFirst({
    where: { competitionId, status: 'SCHEDULED' },
    orderBy: { round: 'asc' },
    select: { round: true, season: true },
  });
  if (!next) return null;

  const round = next.round;
  const season = next.season;

  const fixtures = await prisma.fixture.findMany({
    where: { competitionId, season, round, status: 'SCHEDULED' },
    orderBy: { id: 'asc' },
    include: {
      homeClub: { include: { tactics: { where: { isActive: true }, take: 1 } } },
      awayClub: { include: { tactics: { where: { isActive: true }, take: 1 } } },
    },
  });

  const results: any[] = [];
  const winnersInOrder: string[] = [];
  const playedClubIds: string[] = [];

  for (const f of fixtures) {
    const homeTactic = f.homeClub.tactics[0] ?? null;
    const awayTactic = f.awayClub.tactics[0] ?? null;

    const homePlayers = await prisma.player.findMany({
      where: { OR: [{ clubId: f.homeClubId, loanedToClubId: null }, { loanedToClubId: f.homeClubId }] },
    });
    const awayPlayers = await prisma.player.findMany({
      where: { OR: [{ clubId: f.awayClubId, loanedToClubId: null }, { loanedToClubId: f.awayClubId }] },
    });

    const main = simulateMatch(homePlayers, homeTactic as any, awayPlayers, awayTactic as any);

    let homeGoalsET: number | null = null;
    let awayGoalsET: number | null = null;
    let homePens: number | null = null;
    let awayPens: number | null = null;
    let winnerClubId: string;

    if (main.homeGoals !== main.awayGoals) {
      winnerClubId = main.homeGoals > main.awayGoals ? f.homeClubId : f.awayClubId;
    } else {
      const et = simulateMatch(homePlayers, homeTactic as any, awayPlayers, awayTactic as any);
      homeGoalsET = Math.round(et.homeGoals * 0.33);
      awayGoalsET = Math.round(et.awayGoals * 0.33);
      const totalHome = main.homeGoals + homeGoalsET;
      const totalAway = main.awayGoals + awayGoalsET;
      if (totalHome !== totalAway) {
        winnerClubId = totalHome > totalAway ? f.homeClubId : f.awayClubId;
      } else {
        let h = 0, a = 0;
        for (let k = 0; k < 5; k++) {
          if (Math.random() < 0.75) h++;
          if (Math.random() < 0.75) a++;
        }
        while (h === a) {
          if (Math.random() < 0.75) h++;
          if (Math.random() < 0.75) a++;
        }
        homePens = h;
        awayPens = a;
        winnerClubId = h > a ? f.homeClubId : f.awayClubId;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.create({
        data: {
          fixtureId: f.id,
          homeGoals: main.homeGoals,
          awayGoals: main.awayGoals,
          homeGoalsET, awayGoalsET, homePens, awayPens,
          winnerClubId,
          events: main.events as any,
        },
      });
      await tx.fixture.update({
        where: { id: f.id },
        data: { status: 'PLAYED' },
      });
    });

    winnersInOrder.push(winnerClubId);

    // Фитнес/травмы
    await applyMatchFatigue(f.homeClubId, main.homeLineupIds, f.awayClubId, main.awayLineupIds);
    playedClubIds.push(f.homeClubId, f.awayClubId);

    const scoreStr = homePens !== null
      ? `${main.homeGoals}+${homeGoalsET}:${main.awayGoals}+${awayGoalsET} пен ${homePens}:${awayPens}`
      : homeGoalsET !== null
        ? `${main.homeGoals}+${homeGoalsET}:${main.awayGoals}+${awayGoalsET}`
        : `${main.homeGoals}:${main.awayGoals}`;

    results.push({
      fixtureId: f.id,
      home: f.homeClub.shortName,
      away: f.awayClub.shortName,
      score: scoreStr,
      winner: winnerClubId,
    });
  }

  await dailyRecovery(playedClubIds);

  if (round < 6 && winnersInOrder.length > 0) {
    await drawNextCupRound(competitionId, round, winnersInOrder, season);
  }

  return { round, roundName: CUP_ROUND_NAMES[round], results };
}

async function drawNextCupRound(competitionId: string, currentRound: number, winnersInOrder: string[], season: number) {
  const nextRound = currentRound + 1;
  const dayIndex = nextRound - 1;
  const seasonStart = new Date(); // упрощённо: следующий раунд через CUP_ROUND_DAYS дней от ТЕКУЩЕГО момента
  const scheduledAt = new Date(seasonStart.getTime() + (CUP_ROUND_DAYS[dayIndex] - CUP_ROUND_DAYS[currentRound - 1]) * 24 * 60 * 60 * 1000);

  if (currentRound === 1) {
    const r2existing = await prisma.fixture.findMany({
      where: { competitionId, season, round: 2 },
      select: { homeClubId: true, awayClubId: true },
    });
    const usedAplIds = new Set<string>();
    for (const p of r2existing) {
      usedAplIds.add(p.homeClubId);
      usedAplIds.add(p.awayClubId);
    }

    const allApl = await prisma.club.findMany({
      where: { league: { tier: 1 } },
      select: { id: true },
    });
    const remainingApl = allApl.filter(c => !usedAplIds.has(c.id)).map(c => c.id);

    const shuffledApl = [...remainingApl].sort(() => Math.random() - 0.5);
    const shuffledWinners = [...winnersInOrder].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledApl.length && i < shuffledWinners.length; i++) {
      await prisma.fixture.create({
        data: {
          competitionId, season, round: 2, roundName: CUP_ROUND_NAMES[2],
          scheduledAt, homeClubId: shuffledApl[i], awayClubId: shuffledWinners[i],
        },
      });
    }
    return;
  }

  const shuffled = [...winnersInOrder].sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 >= shuffled.length) break;
    await prisma.fixture.create({
      data: {
        competitionId, season, round: nextRound, roundName: CUP_ROUND_NAMES[nextRound],
        scheduledAt, homeClubId: shuffled[i], awayClubId: shuffled[i + 1],
      },
    });
  }
}
