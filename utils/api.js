const BASE_URL = 'http://78.24.220.105:8000';

export const api = {
  register: async (username, password, secretQuestion, secretAnswer) => {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, secret_question: secretQuestion, secret_answer: secretAnswer }),
    });
    return res.json();
  },
  getSecretQuestions: async () => {
    const res = await fetch(`${BASE_URL}/users/questions`);
    return res.json();
  },
  getResetQuestion: async (username) => {
    const res = await fetch(`${BASE_URL}/users/reset-question/${username}`);
    return res.json();
  },
  resetPassword: async (username, secretAnswer, newPassword) => {
    const res = await fetch(`${BASE_URL}/users/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, secret_answer: secretAnswer, new_password: newPassword }),
    });
    return res.json();
  },
  login: async (username, password) => {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },
  getMe: async (token) => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  selectClub: async (token, clubId) => {
    const res = await fetch(`${BASE_URL}/users/select-club?club_id=${clubId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  getClubs: async (league) => {
    const url = league ? `${BASE_URL}/clubs/?league=${league}` : `${BASE_URL}/clubs/`;
    const res = await fetch(url);
    return res.json();
  },
  getPlayers: async (clubId) => {
    const res = await fetch(`${BASE_URL}/players/?club_id=${Number(clubId)}`);
    return res.json();
  },
  saveTactics: async (token, data) => {
    const res = await fetch(`${BASE_URL}/tactics/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...data }),
    });
    return res.json();
  },
  loadTactics: async (token) => {
    const res = await fetch(`${BASE_URL}/tactics/load`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  getStandings: async (league) => {
    const res = await fetch(`${BASE_URL}/season/standings/${league}`);
    return res.json();
  },
  getMatches: async (league, round) => {
    const res = await fetch(`${BASE_URL}/season/matches/${league}/${round}`);
    return res.json();
  },
  getSeasonResults: async (league) => {
    const res = await fetch(`${BASE_URL}/season/results/${league}`);
    return res.json();
  },
  getCurrentRound: async (league) => {
    const res = await fetch(`${BASE_URL}/season/current-round/${league}`);
    return res.json();
  },

  buyPlayerOffer: async (token, player_id, offer) => {
    const res = await fetch(`${BASE_URL}/transfers/buy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, player_id, offer }),
    });
    return res.json();
  },
  sellPlayerOffer: async (token, player_id, price) => {
    const res = await fetch(`${BASE_URL}/transfers/sell`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, player_id, price }),
    });
    return res.json();
  },
  getMarket: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.position) q.append('position', params.position);
    if (params.min_ovr) q.append('min_ovr', params.min_ovr);
    if (params.max_price) q.append('max_price', params.max_price);
    if (params.free_agents) q.append('free_agents', 'true');
    const res = await fetch(`${BASE_URL}/transfers/market?${q}`);
    return res.json();
  },
  playMatch: async (token, match_id) => {
    const res = await fetch(`${BASE_URL}/match/play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, match_id }),
    });
    return res.json();
  },
  playFriendly: async (token, opponent_id) => {
    const res = await fetch(`${BASE_URL}/match/friendly`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, opponent_id }),
    });
    return res.json();
  },
  listPlayer: async (token, player_id, asking_price) => {
    const res = await fetch(`${BASE_URL}/transfers/list`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, player_id, asking_price }),
    });
    return res.json();
  },
  getTransferOffers: async (token) => {
    const res = await fetch(`${BASE_URL}/transfers/offers/${token}`);
    return res.json();
  },
  respondOffer: async (token, offer_id, accept) => {
    const res = await fetch(`${BASE_URL}/transfers/offer-response`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, offer_id, accept }),
    });
    return res.json();
  },
  getPreseasonStatus: async () => {
    const res = await fetch(`${BASE_URL}/preseason/status`);
    return res.json();
  },
  getPreseasonResults: async (token) => {
    const res = await fetch(`${BASE_URL}/preseason/results`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  playPreseasonMatch: async (token, day, match_num) => {
    const res = await fetch(`${BASE_URL}/preseason/play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, day, match_num }),
    });
    return res.json();
  },
  getTrainingTypes: async () => {
    const res = await fetch(`${BASE_URL}/training/types`);
    return res.json();
  },
  getTrainingStatus: async (token) => {
    const res = await fetch(`${BASE_URL}/training/status/${token}`);
    return res.json();
  },
  startTeamTraining: async (token, focus) => {
    const res = await fetch(`${BASE_URL}/training/team`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, focus }),
    });
    return res.json();
  },
  autoIndividual: async (token) => {
    const res = await fetch(`${BASE_URL}/training/auto-individual`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  startIndividualTraining: async (token, player_id, focus) => {
    const res = await fetch(`${BASE_URL}/training/individual`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, player_id, focus }),
    });
    return res.json();
  },
  getCareer: async (token) => {
    const res = await fetch(`${BASE_URL}/game/career`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  getGameState: async (token) => {
    const res = await fetch(`${BASE_URL}/game/state`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  getNews: async (token) => {
    const res = await fetch(`${BASE_URL}/news/list`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  getCupBracket: async () => {
    const res = await fetch(`${BASE_URL}/cup/bracket`);
    return res.json();
  },
  playCupMatch: async (token, match_id) => {
    const res = await fetch(`${BASE_URL}/cup/play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, match_id }),
    });
    return res.json();
  },
};
