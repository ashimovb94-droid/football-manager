import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigationState } from '@react-navigation/native';

let _club = null;
let _managerName = null;

export function setManagerData(club, managerName) {
  _club = club;
  _managerName = managerName;
}

export function getManagerData() {
  return { club: _club, managerName: _managerName };
}

export default function HomeScreen() {
  const { club, managerName } = getManagerData();

  const news = [
    { id: 1, icon: '📰', title: 'Предсезонная подготовка', text: 'Команда готовится к новому сезону', time: '2 ч назад' },
    { id: 2, icon: '💰', title: 'Трансферное окно открыто', text: 'Летнее окно открыто до 31 августа', time: '5 ч назад' },
    { id: 3, icon: '📋', title: 'Первый матч сезона', text: 'Через 7 дней стартует Чемпионшип', time: '1 д назад' },
  ];

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <View style={s.clubHeader}>
          <View style={s.clubLeft}>
            <Text style={s.clubBadge}>{club?.badge || '⚽'}</Text>
            <View>
              <Text style={s.clubName}>{club?.name || 'Клуб'}</Text>
              <Text style={s.managerName}>👤 {managerName || 'Менеджер'}</Text>
            </View>
          </View>
          <View style={s.seasonBadge}>
            <Text style={s.seasonText}>СЕЗОН 1</Text>
            <Text style={s.leagueText}>ЧЕМПИОНШИП</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsScroll}>
          {[
            { label: 'БЮДЖЕТ',  value: `£${club?.budget || 0}M`, color: '#00d4ff' },
            { label: 'РЕЙТИНГ', value: club?.rating || 50,        color: '#ffd700' },
            { label: 'ИГРОКОВ', value: 23,                         color: '#00ff88' },
            { label: 'МАТЧЕЙ',  value: 0,                          color: '#ff6b35' },
            { label: 'ОЧКОВ',   value: 0,                          color: '#7b2fff' },
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={s.nextMatch}>
          <Text style={s.sectionTitle}>СЛЕДУЮЩИЙ МАТЧ</Text>
          <View style={s.matchCard}>
            <View style={s.matchTeam}>
              <Text style={s.matchBadge}>{club?.badge || '⚽'}</Text>
              <Text style={s.matchTeamName}>{club?.name || 'Клуб'}</Text>
            </View>
            <View style={s.matchCenter}>
              <Text style={s.matchVs}>VS</Text>
              <Text style={s.matchDate}>12 АВГ · 15:00</Text>
              <Text style={s.matchComp}>ЧЕМПИОНШИП</Text>
            </View>
            <View style={s.matchTeam}>
              <Text style={s.matchBadge}>🔴</Text>
              <Text style={s.matchTeamName}>Sunderland</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>НОВОСТИ КЛУБА</Text>
        {news.map(item => (
          <TouchableOpacity key={item.id} style={s.newsCard}>
            <Text style={s.newsIcon}>{item.icon}</Text>
            <View style={s.newsInfo}>
              <Text style={s.newsTitle}>{item.title}</Text>
              <Text style={s.newsText}>{item.text}</Text>
            </View>
            <Text style={s.newsTime}>{item.time}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#0a0a0f' },
  inner:         { padding: 20, paddingTop: 56, paddingBottom: 20 },
  clubHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  clubLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clubBadge:     { fontSize: 44 },
  clubName:      { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  managerName:   { fontSize: 12, color: '#8888aa', marginTop: 2 },
  seasonBadge:   { backgroundColor: '#12121a', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  seasonText:    { fontSize: 13, fontWeight: '900', color: '#00d4ff', letterSpacing: 1 },
  leagueText:    { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  statsScroll:   { marginBottom: 24 },
  statCard:      { backgroundColor: '#12121a', borderRadius: 14, padding: 16, marginRight: 10, alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: '#ffffff15' },
  statVal:       { fontSize: 20, fontWeight: '900' },
  statLabel:     { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 4 },
  sectionTitle:  { fontSize: 11, color: '#8888aa', letterSpacing: 3, marginBottom: 12 },
  nextMatch:     { marginBottom: 24 },
  matchCard:     { backgroundColor: '#12121a', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  matchTeam:     { flex: 1, alignItems: 'center' },
  matchBadge:    { fontSize: 32, marginBottom: 6 },
  matchTeamName: { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center' },
  matchCenter:   { alignItems: 'center', paddingHorizontal: 12 },
  matchVs:       { fontSize: 18, fontWeight: '900', color: '#00d4ff', letterSpacing: 2 },
  matchDate:     { fontSize: 11, color: '#fff', marginTop: 4, fontWeight: '700' },
  matchComp:     { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  newsCard:      { backgroundColor: '#12121a', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#ffffff15' },
  newsIcon:      { fontSize: 28, marginRight: 14 },
  newsInfo:      { flex: 1 },
  newsTitle:     { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 4 },
  newsText:      { fontSize: 12, color: '#8888aa' },
  newsTime:      { fontSize: 10, color: '#8888aa', marginLeft: 8 },
});
