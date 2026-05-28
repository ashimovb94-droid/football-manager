const BASE_URL = 'http://78.24.220.105:8000';

export const api = {
  register: async (email, password, managerName) => {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, manager_name: managerName }),
    });
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  getMe: async (token) => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },

  selectClub: async (token, clubId) => {
    const res = await fetch(`${BASE_URL}/users/select-club?club_id=${clubId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
};
