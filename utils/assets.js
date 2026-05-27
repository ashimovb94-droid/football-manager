// Заглушки пока нет реальных фото
const DEFAULT_PLAYER = require('../assets/players/default.png');
const DEFAULT_CLUB = require('../assets/clubs/default.png');

export const getPlayerPhoto = (playerId) => {
  try {
    return require(`../assets/players/${playerId}.png`);
  } catch {
    return DEFAULT_PLAYER;
  }
};

export const getClubLogo = (clubId) => {
  try {
    return require(`../assets/clubs/${clubId}.png`);
  } catch {
    return DEFAULT_CLUB;
  }
};

export const getLeagueLogo = (leagueId) => {
  try {
    return require(`../assets/leagues/${leagueId}.png`);
  } catch {
    return null;
  }
};
