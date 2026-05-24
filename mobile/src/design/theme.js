import { StyleSheet } from 'react-native';

export const C = {
  bg:           '#0d1117',
  card:         'rgba(22, 30, 43, 0.85)',
  cardDeep:     'rgba(16, 21, 30, 0.9)',
  border:       'rgba(255,255,255,0.06)',
  borderActive: 'rgba(79,195,247,0.4)',
  accent:       '#4fc3f7',
  accentDim:    'rgba(79,195,247,0.1)',
  green:        '#2ecc71',
  greenDim:     'rgba(46,204,113,0.12)',
  gold:         '#f1c40f',
  goldDim:      'rgba(241,196,15,0.15)',
  red:          '#e74c3c',
  redDim:       'rgba(231,76,60,0.15)',
  purple:       '#9b59b6',
  muted:        '#7a8a9e',
  subtle:       '#3a4558',
  text:         '#ffffff',
};

export const FX = StyleSheet.create({
  // flex: 1 и прозрачный фон, если у тебя под низом висит картинка стадиона
  bg: { flex: 1, backgroundColor: 'transparent' }, 
  
  // Единая карточка для всех экранов
  card: { 
    backgroundColor: C.card, 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: C.border,
    marginBottom: 12 
  },
  
  // Скругленные плашки для рейтингов и статусов
  pill: { 
    borderRadius: 999, 
    paddingHorizontal: 12, 
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

// Цвета зон таблицы (АПЛ)
export const zoneColorApl = (pos) => {
  if (pos <= 4) return C.green;
  if (pos === 5) return C.accent;
  if (pos === 6) return C.gold;
  if (pos >= 18) return C.red;
  return null;
};

// Цвета зон таблицы (Чемпионшип)
export const zoneColorChamp = (pos) => {
  if (pos <= 3) return C.green;
  if (pos >= 22) return C.red;
  return null;
};

// Группы позиций
export const POSITION_GROUP = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'FWD', RW: 'FWD', ST: 'FWD', CF: 'FWD'
};

// Цвета линий на поле
export const POS_COLOR = {
  GK:  C.gold,
  DEF: C.accent,
  MID: C.green,
  FWD: C.red,
};

// Расчет рейтинга (восстановил обрезанную математику)
export function overall(p) {
  if (!p) return 0;
  return p.position === 'GK'
    ? Math.round(p.goalkeeping * 0.6 + p.physical * 0.4)
    : Math.round((p.pace + p.shooting + p.passing + p.dribbling + p.defending + p.physical) / 6);
}

// Цвет выносливости/формы
export function fitnessColor(f) {
  if (f >= 80) return C.green;
  if (f >= 60) return '#a3d93d';
  if (f >= 40) return C.gold;
  return C.red;
}

