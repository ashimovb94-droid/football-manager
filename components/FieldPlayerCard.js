import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';

const POS_COLORS = {
  GK:  '#f59e0b',
  CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6', LWB: '#3b82f6', RWB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981', LM: '#10b981', RM: '#10b981',
  LW:  '#ef4444', RW: '#ef4444', ST: '#ef4444',
};

const CARD_THEMES = {
  elite:  { grad1: '#1a3a6b', grad2: '#0a1628', accent: '#4a90ff', border: '#4a90ff' },
  rare:   { grad1: '#0a3020', grad2: '#051510', accent: '#00ff88', border: '#00cc66' },
  gold:   { grad1: '#3d2e00', grad2: '#1a1200', accent: '#ffd700', border: '#cc9900' },
  silver: { grad1: '#2a2a2a', grad2: '#141414', accent: '#cccccc', border: '#888888' },
  bronze: { grad1: '#2a1500', grad2: '#120800', accent: '#cd7f32', border: '#8b4513' },
};

const getTheme = (ovr) => {
  if (ovr >= 90) return CARD_THEMES.elite;
  if (ovr >= 80) return CARD_THEMES.gold;
  if (ovr >= 70) return CARD_THEMES.silver;
  return CARD_THEMES.bronze;
};

const W = 46;
const H = 56;

function CardSvg({ theme }) {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.grad1} />
          <Stop offset="1" stopColor={theme.grad2} />
        </LinearGradient>
        <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Фон */}
      <Rect x="0" y="0" width={W} height={H} rx="6" fill="url(#bg)" />
      {/* Граница */}
      <Rect x="0.75" y="0.75" width={W-1.5} height={H-1.5} rx="5.5" fill="none" stroke={theme.border} strokeWidth="1.5" />
      {/* Блеск */}
      <Rect x="0" y="0" width={W} height={H} rx="6" fill="url(#shine)" />
      {/* Верхняя полоска */}
      <Rect x="4" y="4" width={W-8} height="2.5" rx="1.25" fill={theme.accent} opacity="0.8" />
    </Svg>
  );
}

export default function FieldPlayerCard({ pos, player, onPress, onLongPress }) {
  const posColor = POS_COLORS[pos.label] || '#666';

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      {player ? (
        <View style={s.card}>
          <CardSvg theme={getTheme(player.overall)} />
          <Text style={[s.ovr, { color: getTheme(player.overall).accent }]}>{player.overall}</Text>
          <Text style={s.name} numberOfLines={1}>{player.surname}</Text>
          <Text style={[s.pos, { color: posColor }]}>{pos.label}</Text>
        </View>
      ) : (
        <View style={[s.emptyCard, { borderColor: posColor + '40' }]}>
          <Text style={[s.emptyPos, { color: posColor + '90' }]}>{pos.label}</Text>
          <Text style={s.emptyPlus}>+</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:      { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  ovr:       { fontSize: 14, fontWeight: '900', marginTop: 10, zIndex: 1 },
  name:      { fontSize: 7, fontWeight: '700', color: '#ddd', textAlign: 'center', width: W-4, zIndex: 1 },
  pos:       { fontSize: 7, fontWeight: '900', letterSpacing: 0.5, marginTop: 1, zIndex: 1 },
  emptyCard: { width: W, height: H, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed', backgroundColor: '#ffffff05', alignItems: 'center', justifyContent: 'center' },
  emptyPos:  { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  emptyPlus: { fontSize: 18, color: '#ffffff20', marginTop: 1 },
});
