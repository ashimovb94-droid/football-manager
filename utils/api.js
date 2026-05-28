const BASE_URL = 'http://78.24.220.105:8000';

export const api = {
  // Auth
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

  // Clubs
  getClubs: async (league) => {
    const url = league ? `${BASE_URL}/clubs/?league=${league}` : `${BASE_URL}/clubs/`;
    const res = await fetch(url);
    return res.json();
  },

  // Players
  getPlayers: async (clubId) => {
    const url = clubId ? `${BASE_URL}/players/?club_id=${clubId}` : `${BASE_URL}/players/`;
    const res = await fetch(url);
    return res.json();
  },
};
