import { FORMATIONS } from '../data/tactics';

// Приоритеты замен — строго по логике
const FALLBACK = {
  GK:  ['GK'],
  CB:  ['CB', 'RB', 'LB'],
  LB:  ['LB', 'RB', 'CB'],
  RB:  ['RB', 'LB', 'CB'],
  LWB: ['LWB', 'LB', 'RB', 'CB'],
  RWB: ['RWB', 'RB', 'LB', 'CB'],
  CDM: ['CDM', 'CM'],
  CM:  ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM', 'CDM'],
  LM:  ['LM', 'CM', 'CDM'],
  RM:  ['RM', 'CM', 'CDM'],
  LW:  ['LW', 'LM'],
  RW:  ['RW', 'RM'],
  ST:  ['ST'],
};

export const buildAutoLineup = (players, formationKey = '4-3-3') => {
  const formation = FORMATIONS[formationKey];
  if (!formation) return {};

  const used = new Set();
  const lineup = {};

  // Сортируем позиции: сначала GK, потом защита, потом полузащита, потом нападение
  const order = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];
  const sorted = [...formation.positions].sort((a, b) => {
    return order.indexOf(a.label) - order.indexOf(b.label);
  });

  for (const pos of sorted) {
    const priorities = FALLBACK[pos.label] || [pos.label];
    
    for (const prio of priorities) {
      // Ищем лучшего игрока на этой позиции (по overall)
      const candidates = players
        .filter(p => p.position === prio && !used.has(p.id))
        .sort((a, b) => b.overall - a.overall);
      
      if (candidates.length > 0) {
        lineup[pos.id] = candidates[0];
        used.add(candidates[0].id);
        break;
      }
    }
  }

  return lineup;
};
