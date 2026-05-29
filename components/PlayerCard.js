import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import PlayerAvatar from './PlayerAvatar';
import { Ionicons } from '@expo/vector-icons';

const POS_COLORS = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981',
  LW: '#ef4444', RW: '#ef4444', ST: '#ef4444',
};

const OVR_COLOR = (v) => {
  if (v >= 85) return '#ffd700';
  if (v >= 75) return '#00d4ff';
  if (v >= 65) return '#00ff88';
  return '#8888aa';
};

export default function PlayerCard({ player, visible, onClose }) {
  if (!player) return null;

  const stats = [
    { label: 'ОБЩИЙ', value: player.overall },
    { label: 'ПОТЕНЦИАЛ', value: player.potential },
    { label: 'ФОРМА', value: player.fitness },
    { label: 'МОРАЛЬ', value: `${player.morale}/10` },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          {/* Шапка */}
          <View style={[s.header, { backgroundColor: POS_COLORS[player.position] + '22' }]}>
            <PlayerAvatar player={player} size={56} showPos={false} />
            <View style={[s.posTag, { backgroundColor: POS_COLORS[player.position] || '#666' }]}>
              <Text style={s.posText}>{player.position}</Text>
            </View>
            <View style={s.headerInfo}>
              <Text style={s.playerName}>{player.name} {player.surname}</Text>
              <Text style={s.playerNat}>{player.nationality} · {player.age} лет</Text>
            </View>
            <View style={s.ovrBox}>
              <Text style={[s.ovrVal, { color: OVR_COLOR(player.overall) }]}>{player.overall}</Text>
              <Text style={s.ovrLabel}>OVR</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.body}>
            {/* Статы */}
            <View style={s.statsGrid}>
              {stats.map(item => (
                <View key={item.label} style={s.statBox}>
                  <Text style={[s.statVal, { color: OVR_COLOR(item.value) }]}>{item.value}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={s.divider} />

            {/* Контракт */}
            <Ionicons name='briefcase-outline' size={16} color='#8888aa' />
            <View style={s.infoRow}>
              <View style={s.infoBox}>
                <Text style={s.infoVal}>£{player.salary}k</Text>
                <Text style={s.infoLabel}>ЗАРПЛАТА/НЕД</Text>
              </View>
              <View style={s.infoBox}>
                <Text style={s.infoVal}>£{player.value}M</Text>
                <Text style={s.infoLabel}>СТОИМОСТЬ</Text>
              </View>
              <View style={s.infoBox}>
                <Text style={s.infoVal}>{player.contract}</Text>
                <Text style={s.infoLabel}>ДО ГОДА</Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Сезонная статистика */}
            <Ionicons name='bar-chart-outline' size={16} color='#8888aa' />
            <View style={s.infoRow}>
              <View style={s.infoBox}>
                <Text style={s.infoVal}>{player.stats?.matches || 0}</Text>
                <Text style={s.infoLabel}>МАТЧЕЙ</Text>
              </View>
              <View style={s.infoBox}>
                <Text style={s.infoVal}>{player.stats?.goals || 0}</Text>
                <Text style={s.infoLabel}>ГОЛОВ</Text>
              </View>
              <View style={s.infoBox}>
                <Text style={s.infoVal}>{player.stats?.assists || 0}</Text>
                <Text style={s.infoLabel}>ПЕРЕДАЧ</Text>
              </View>
              <View style={s.infoBox}>
                <Text style={s.infoVal}>{player.stats?.yellow || 0}</Text>
                <Text style={s.infoLabel}>ЖК</Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Травма */}
            <Ionicons name='medkit-outline' size={16} color='#8888aa' />
            <View style={s.healthRow}>
              <View style={s.healthBar}>
                <Text style={s.healthLabel}>УСТАЛОСТЬ</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${player.fatigue || 0}%`, backgroundColor: '#ff6b35' }]} />
                </View>
              </View>
              <View style={s.healthBar}>
                <Text style={s.healthLabel}>ФОРМА</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${player.fitness || 100}%`, backgroundColor: '#00ff88' }]} />
                </View>
              </View>
            </View>

            {player.injury && (
              <View style={s.injuryBox}>
                <Text style={s.injuryText}>🤕 Травма: {player.injury}</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>ЗАКРЫТЬ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  modal:        { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#ffffff15', maxHeight: '85%' },

  playerPhoto:  { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#ffffff40' },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  posTag:       { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  posText:      { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  headerInfo:   { flex: 1 },
  playerName:   { fontSize: 18, fontWeight: '900', color: '#fff' },
  playerNat:    { fontSize: 12, color: '#8888aa', marginTop: 2 },
  ovrBox:       { alignItems: 'center' },
  ovrVal:       { fontSize: 28, fontWeight: '900' },
  ovrLabel:     { fontSize: 9, color: '#8888aa', letterSpacing: 1 },
  body:         { padding: 20 },
  statsGrid:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox:      { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, padding: 12, alignItems: 'center' },
  statVal:      { fontSize: 18, fontWeight: '900' },
  statLabel:    { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 3 },
  divider:      { height: 1, backgroundColor: '#ffffff10', marginVertical: 16 },
  sectionTitle: { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginBottom: 12 },
  infoRow:      { flexDirection: 'row', gap: 10 },
  infoBox:      { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, padding: 12, alignItems: 'center' },
  infoVal:      { fontSize: 15, fontWeight: '900', color: '#fff' },
  infoLabel:    { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 3 },
  healthRow:    { gap: 10 },
  healthBar:    { marginBottom: 8 },
  healthLabel:  { fontSize: 10, color: '#8888aa', letterSpacing: 1, marginBottom: 4 },
  barBg:        { height: 6, backgroundColor: '#ffffff15', borderRadius: 3 },
  barFill:      { height: 6, borderRadius: 3 },
  injuryBox:    { backgroundColor: '#ff335520', borderRadius: 10, padding: 12, marginTop: 8 },
  injuryText:   { color: '#ff3355', fontSize: 13, fontWeight: '700' },
  closeBtn:     { margin: 16, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  closeBtnText: { color: '#8888aa', fontWeight: '800', letterSpacing: 2, fontSize: 13 },
});
