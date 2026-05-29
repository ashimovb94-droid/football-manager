const BASE_URL = 'http://78.24.220.105:8000';

export const api = {
  register: async (email, password, managerName) => {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, manager_name: managerName }),
    });
    return res.json();
  },
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
  getCurrentRound: async (league) => {
    const res = await fetch(`${BASE_URL}/season/current-round/${league}`);
    return res.json();
  },
  getMarket: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.position) q.append('position', params.position);
    if (params.min_ovr) q.append('min_ovr', params.min_ovr);
    if (params.max_price) q.append('max_price', params.max_price);
    const res = await fetch(`${BASE_URL}/transfers/market?${q}`);
    return res.json();
  },
  buyPlayer: async (token, player_id) => {
    const res = await fetch(`${BASE_URL}/transfers/buy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, player_id, transfer_type: 'buy' }),
    });
    return res.json();
  },
  sellPlayer: async (token, player_id) => {
    const res = await fetch(`${BASE_URL}/transfers/sell`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, player_id, transfer_type: 'sell' }),
    });
    return res.json();
  },
  playMatch: async (token, match_id) => {
    const res = await fetch(`${BASE_URL}/match/play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, match_id }),
    });
    return res.json();
  },
  getPreseasonResults: async (token) => {
    const res = await fetch(`${BASE_URL}/preseason/results`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },
  getPreseasonStatus: async () => {
    const res = await fetch(`${BASE_URL}/preseason/status`);
    return res.json();
  },
  playPreseasonMatch: async (token, day, match_num) => {
    const res = await fetch(`${BASE_URL}/preseason/play`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, day, match_num }),
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
};