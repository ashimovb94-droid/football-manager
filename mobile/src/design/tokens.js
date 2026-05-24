export const colors = {
  bg:           '#0d1117',
  bgElevated:   'rgba(16, 21, 30, 0.95)',
  bgSubtle:     'rgba(22, 28, 40, 0.9)',
  bgCard:       'rgba(10, 15, 25, 0.9)',
  divider:      'rgba(255,255,255,0.06)',

  text:         '#ffffff',
  textMuted:    '#8899aa',
  textSubtle:   '#4a5568',

  accent:       '#4fc3f7',   // голубой — основной
  accentGreen:  '#2ecc71',   // зелёный — успех, мой клуб
  accentGold:   '#f1c40f',   // золотой — важное
  warning:      '#f39c12',
  danger:       '#e74c3c',
  purple:       '#9b59b6',

  zoneCl:       '#2ecc71',
  zoneEl:       '#4fc3f7',
  zoneEcl:      '#f39c12',
  zoneRel:      '#e74c3c',

  posGK:        '#f1c40f',
  posDef:       '#4fc3f7',
  posMid:       '#2ecc71',
  posFwd:       '#e74c3c',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const radii = {
  sm: 6, md: 10, lg: 14, xl: 20, pill: 999,
};

export const typography = {
  display: 28, title: 22, heading: 17, body: 14, caption: 12, micro: 10,
  bold: '700', semibold: '600', medium: '500', regular: '400',
};

export function contrastTextColor(hexBg) {
  if (!hexBg) return colors.text;
  const hex = hexBg.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0d1117' : '#ffffff';
}

export function withAlpha(hex, alpha = 0.2) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
