import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { loadManagerData } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';

export default function HomeScreen() {
  const [club, setClub] = useState(null);
  const [managerName, setManagerName] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { token } = await import('../utils/storage').then(m => m.loadSession());
      const { club, managerName } = await loadManagerData();
      setManagerName(managerName);
      if (club) api.getPlayers(club.id).then(p => setPlayerCount(p.length));
      if (token) {
        const user = await api.getMe(token);
        if (user && user.club) {
          setClub(user.club);
          await import('../utils/storage').then(m => m.saveManagerData(user.club, managerName));
        } else {
          setClub(club);
        }
      } else {
        setClub(club);
      }
    };
    load();
  }, []);

  const news = [
    { id: 1, icon: '📰', title: 'Предсезонная подготовка', text: 'Команда готовится к новому сезону', time: '2 ч назад' },
    { id: 2, icon: '💰', title: 'Трансферное окно открыто', text: 'Летнее окно открыто до 31 августа', time: '5 ч назад' },
    { id: 3, icon: '📋', title: 'Первый матч сезона', text: 'Через 7 дней стартует Чемпионшип', time: '1 д назад' },
  ];

  const opponent = { id: '3', name: 'Millwall', primary: '#001D5E', secondary: '#FFFFFF' };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <View style={s.clubHeader}>
          <View style={s.clubLeft}>
            <ClubBadge club={club} size={56} />
            <View style={s.clubInfo}>
              <Text style={s.clubName}>{club?.name || '...'}</Text>
              <Text style={s.managerName}>👤 {managerName || '...'}</Text>
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
            { label: 'ИГРОКОВ', value: playerCount,                color: '#00ff88' },
            { label: 'МАТЧЕЙ',  value: 0,                          color: '#ff6b35' },
            { label: 'ОЧКОВ',   value: 0,                          color: '#7b2fff' },
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={s.section}>
          <Text style={s.sectionTitle}>СЛЕДУЮЩИЙ МАТЧ</Text>
          <View style={s.matchCard}>
            <View style={s.matchTeam}>
              <ClubBadge club={club} size={48} />
              <Text style={s.matchTeamName}>{club?.name || '...'}</Text>
            </View>
            <View style={s.matchCenter}>
              <Text style={s.matchVs}>VS</Text>
              <Text style={s.matchDate}>12 АВГ</Text>
              <Text style={s.matchTime}>15:00</Text>
              <Text style={s.matchComp}>ЧЕМПИОНШИП</Text>
            </View>
            <View style={s.matchTeam}>
              <ClubBadge club={opponent} size={48} />
              <Text style={s.matchTeamName}>{opponent.name}</Text>
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
  clubInfo:      { justifyContent: 'center' },
  clubName:      { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  managerName:   { fontSize: 12, color: '#8888aa', marginTop: 2 },
  seasonBadge:   { backgroundColor: '#12121a', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  seasonText:    { fontSize: 13, fontWeight: '900', color: '#00d4ff', letterSpacing: 1 },
  leagueText:    { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  statsScroll:   { marginBottom: 24 },
  statCard:      { backgroundColor: '#12121a', borderRadius: 14, padding: 16, marginRight: 10, alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: '#ffffff15' },
  statVal:       { fontSize: 20, fontWeight: '900' },
  statLabel:     { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 4 },
  section:       { marginBottom: 24 },
  sectionTitle:  { fontSize: 11, color: '#8888aa', letterSpacing: 3, marginBottom: 12 },
  matchCard:     { backgroundColor: '#12121a', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  matchTeam:     { flex: 1, alignItems: 'center', gap: 8 },
  matchTeamName: { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center' },
  matchCenter:   { alignItems: 'center', paddingHorizontal: 12 },
  matchVs:       { fontSize: 18, fontWeight: '900', color: '#00d4ff', letterSpacing: 2 },
  matchDate:     { fontSize: 13, color: '#fff', marginTop: 4, fontWeight: '800' },
  matchTime:     { fontSize: 11, color: '#8888aa' },
  matchComp:     { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  newsCard:      { backgroundColor: '#12121a', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#ffffff15' },
  newsIcon:      { fontSize: 28, marginRight: 14 },
  newsInfo:      { flex: 1 },
  newsTitle:     { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 4 },
  newsText:      { fontSize: 12, color: '#8888aa' },
  newsTime:      { fontSize: 10, color: '#8888aa', marginLeft: 8 },
});
