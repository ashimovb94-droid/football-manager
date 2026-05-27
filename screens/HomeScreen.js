import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen({ route }) {
  const { managerName, club } = route.params;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.inner}>
        <View style={s.header}>
          <Text style={s.badge}>{club.badge}</Text>
          <View>
            <Text style={s.club}>{club.name}</Text>
            <Text style={s.manager}>👤 {managerName}</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>£{club.budget}M</Text>
            <Text style={s.statLabel}>БЮДЖЕТ</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>{club.rating}</Text>
            <Text style={s.statLabel}>РЕЙТИНГ</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>1</Text>
            <Text style={s.statLabel}>СЕЗОН</Text>
          </View>
        </View>
        {[
          { icon: '👥', label: 'СОСТАВ' },
          { icon: '🔄', label: 'ТРАНСФЕРЫ' },
          { icon: '📋', label: 'ТАКТИКА' },
          { icon: '🏋️', label: 'ТРЕНИРОВКИ' },
          { icon: '📅', label: 'РАСПИСАНИЕ' },
          { icon: '💰', label: 'ФИНАНСЫ' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={s.menuItem}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: '#0a0a0f' },
  inner:     { padding: 24, paddingTop: 60 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  badge:     { fontSize: 48 },
  club:      { fontSize: 22, fontWeight: '900', color: '#fff' },
  manager:   { fontSize: 13, color: '#8888aa', marginTop: 2 },
  statsRow:  { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBox:   { flex: 1, backgroundColor: '#12121a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  statVal:   { fontSize: 18, fontWeight: '900', color: '#00d4ff' },
  statLabel: { fontSize: 10, color: '#8888aa', letterSpacing: 1, marginTop: 4 },
  menuItem:  { backgroundColor: '#12121a', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#ffffff15' },
  menuIcon:  { fontSize: 22, marginRight: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  menuArrow: { fontSize: 22, color: '#8888aa' },
});
