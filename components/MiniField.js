import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FORMATIONS } from '../data/tactics';

const { width: SW } = Dimensions.get('window');
const FIELD_W = SW - 40;
const FIELD_H = FIELD_W * 0.65;

const POS_COLORS = {
  GK:  '#f59e0b',
  CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6', LWB: '#3b82f6', RWB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981', LM: '#10b981', RM: '#10b981',
  LW:  '#ef4444', RW: '#ef4444', ST: '#ef4444',
};

export default function MiniField({ formation = '4-3-3', lineup = {}, onPress }) {
  const f = FORMATIONS[formation];
  if (!f) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[s.field, { width: FIELD_W, height: FIELD_H }]}>
        {/* Разметка */}
        <View style={s.midLine} />
        <View style={s.circle} />
        <View style={s.penTop} />
        <View style={s.penBot} />

        {/* Схема */}
        <View style={s.formationTag}>
          <Text style={s.formationText}>{formation}</Text>
        </View>

        {/* Игроки */}
        {f.positions.map(pos => {
          const player = lineup[pos.id];
          const color = POS_COLORS[pos.label] || '#666';
          return (
            <View
              key={pos.id}
              style={[s.dot, {
                left: (pos.x / 100) * FIELD_W - 14,
                top: (pos.y / 100) * FIELD_H - 14,
                backgroundColor: player ? color : '#1a1a2e',
                borderColor: player ? color + 'aa' : '#333',
              }]}
            >
              <Text style={s.dotLabel}>{pos.label}</Text>
            </View>
          );
        })}

        {/* Тап оверлей */}
        <View style={s.tapHint}>
          <Text style={s.tapText}>✏️ ТАКТИКА</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  field:       { backgroundColor: '#0d0a1f', borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#7b2fff20' },
  midLine:     { position: 'absolute', width: '100%', height: 1, backgroundColor: '#7b2fff30', top: '50%' },
  circle:      { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#7b2fff30', top: '50%', left: '50%', marginTop: -25, marginLeft: -25 },
  penTop:      { position: 'absolute', width: '45%', height: '18%', borderWidth: 1, borderColor: '#7b2fff30', top: 0, left: '27.5%', borderTopWidth: 0 },
  penBot:      { position: 'absolute', width: '45%', height: '18%', borderWidth: 1, borderColor: '#7b2fff30', bottom: 0, left: '27.5%', borderBottomWidth: 0 },
  formationTag:{ position: 'absolute', top: 6, left: 8, backgroundColor: '#00000050', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  formationText:{ fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  dot:         { position: 'absolute', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  dotLabel:    { fontSize: 7, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  tapHint:     { position: 'absolute', bottom: 6, right: 8, backgroundColor: '#00000060', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tapText:     { fontSize: 9, color: '#00d4ff', fontWeight: '700', letterSpacing: 1 },
});
