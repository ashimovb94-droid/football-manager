import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { loadManagerData, loadSession } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';
import LeagueBadge from '../components/LeagueBadge';

const ZONE_COLORS = {
  championship: {
    1: '#00ff88', 2: '#00ff88',           // Авто повышение
    3: '#00d4ff', 4: '#00d4ff', 5: '#00d4ff', 6: '#00d4ff', // Плей-офф
    19: '#ff6b35', 20: '#ff6b35', 21: '#ff6b35',
    22: '#ff3355', 23: '#ff3355', 24: '#ff3355', // Вылет
  },
  epl: {
    1: '#ffd700', 2: '#ffd700', 3: '#ffd700', 4: '#ffd700', // ЛЧ
    5: '#00d4ff', 6: '#00d4ff',            // ЛЕ
    7: '#00ff88',                           // ЛК
    18: '#ff6b35', 19: '#ff6b35', 20: '#ff3355', // Вылет
  },
};

const ZONE_LABELS = {
  championship: {
    2: 'Повышение',
    6: 'Плей-офф',
    18: 'Вылет',
  },
  epl: {
    4: 'Лига Чемпионов',
    6: 'Лига Европы',
    7: 'Лига Конференций',
    17: 'Вылет',
  },
};

export default function SeasonScreen() {
  const [tab, setTab] = useState('table');
  const [league, setLeague] = useState('championship');
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [round, setRound] = useState(1);
  const [maxRound] = useState(46);
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState(null);
  const [token, setToken] = useState(null);
  const [preseasonDone, setPreseasonDone] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadSession().then(({ token }) => setToken(token));
    api.getPreseasonStatus().then(s => setPreseasonDone(s?.season_started || false));
    loadManagerData().then(({ club }) => {
      setClub(club);
      const lg = club?.league || 'championship';
      setLeague(lg);
      loadData(lg);
    });
  }, []);

  const loadData = async (lg) => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        api.getStandings(lg),
        api.getCurrentRound(lg),
      ]);
      setStandings(s);
      setRound(r.round || 1);
      const m = await api.getMatches(lg, r.round || 1);
      setMatches(m);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const loadRound = async (r) => {
    setRound(r);
    const m = await api.getMatches(league, r);
    setMatches(m);
  };

  const zoneColor = ZONE_COLORS[league] || {};
  const myClubId = club?.id ? Number(club.id) : null;

  const renderStanding = ({ item }) => {
    const color = zoneColor[item.position];
    const isMe = Number(item.club_id) === myClubId;
    return (
      <View style={[s.row, isMe && s.rowMe]}>
        <View style={[s.posIndicator, { backgroundColor: color || 'transparent' }]} />
        <Text style={[s.pos, isMe && s.textMe]}>{item.position}</Text>
        <View style={s.clubCell}>
          <ClubBadge club={{ id: String(item.club_id), name: item.club_name, primary: '#333', secondary: '#fff' }} size={20} />
          <Text style={[s.clubName, isMe && s.textMe]} numberOfLines={1}>{item.club_name}</Text>
        </View>
        <Text style={[s.cell, isMe && s.textMe]}>{item.played}</Text>
        <Text style={[s.cell, isMe && s.textMe]}>{item.won}</Text>
        <Text style={[s.cell, isMe && s.textMe]}>{item.drawn}</Text>
        <Text style={[s.cell, isMe && s.textMe]}>{item.lost}</Text>
        <Text style={[s.cell, isMe && s.textMe]}>{item.gd > 0 ? '+' : ''}{item.gd}</Text>
        <Text style={[s.pts, isMe && s.textMe]}>{item.points}</Text>
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={s.title}>СЕЗОН</Text>
          <LeagueBadge league={league} size={32} showName={true} />
        </View>
        <Text style={s.sub}>ТУР {round}</Text>
      </View>

      <View style={s.tabs}>
        {[{ id: 'table', label: 'ТАБЛИЦА' }, { id: 'fixtures', label: 'МАТЧИ' }].map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, tab === t.id && s.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loader}><ActivityIndicator size="large" color="#00d4ff" /></View>
      ) : tab === 'table' ? (
        <>
          {/* Заголовок таблицы */}
          <View style={s.tableHeader}>
            <View style={s.posIndicator} />
            <Text style={s.thPos}>#</Text>
            <View style={s.clubCell}><Text style={s.th}>КЛУБ</Text></View>
            <Text style={s.th}>И</Text>
            <Text style={s.th}>В</Text>
            <Text style={s.th}>Н</Text>
            <Text style={s.th}>П</Text>
            <Text style={s.th}>РМ</Text>
            <Text style={s.thPts}>О</Text>
          </View>

          {/* Зоны */}
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: '#00ff88' }]} />
            <Text style={s.legendText}>{league === 'championship' ? 'Повышение' : 'Лига Чемпионов'}</Text>
            <View style={[s.legendDot, { backgroundColor: '#00d4ff', marginLeft: 12 }]} />
            <Text style={s.legendText}>{league === 'championship' ? 'Плей-офф' : 'Лига Европы'}</Text>
            <View style={[s.legendDot, { backgroundColor: '#ff3355', marginLeft: 12 }]} />
            <Text style={s.legendText}>Вылет</Text>
          </View>

          <FlatList
            data={standings}
            keyExtractor={i => String(i.club_id)}
            renderItem={renderStanding}
          />
        </>
      ) : (
        <>
          {/* Навигация по турам */}
          <View style={s.roundNav}>
            <TouchableOpacity style={s.roundBtn} onPress={() => round > 1 && loadRound(round - 1)}>
              <Text style={s.roundBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={s.roundLabel}>ТУР {round}</Text>
            <TouchableOpacity style={s.roundBtn} onPress={() => round < maxRound && loadRound(round + 1)}>
              <Text style={s.roundBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={matches}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={s.matchList}
            renderItem={({ item }) => {
              const isMyMatch = Number(item.home_id) === myClubId || Number(item.away_id) === myClubId;
              return (
                <View style={[s.matchCard, isMyMatch && s.matchCardMe]}>
                  <View style={s.matchTeam}>
                    <ClubBadge club={{ id: String(item.home_id), primary: item.home_primary, secondary: '#fff', name: item.home_name }} size={32} />
                    <Text style={[s.matchTeamName, isMyMatch && s.textMe]} numberOfLines={1}>{item.home_name}</Text>
                  </View>
                  <View style={s.matchScore}>
                    {item.status === 'finished' ? (
                      <Text style={s.scoreText}>{item.home_score} - {item.away_score}</Text>
                    ) : (
                      <>
                        <Text style={s.scoreVs}>VS</Text>
                        <Text style={s.scoreDate}>{item.date?.slice(5)}</Text>
                      </>
                    )}
                  </View>
                  <View style={[s.matchTeam, s.matchTeamRight]}>
                    <ClubBadge club={{ id: String(item.away_id), primary: item.away_primary, secondary: '#fff', name: item.away_name }} size={32} />
                    <Text style={[s.matchTeamName, isMyMatch && s.textMe]} numberOfLines={1}>{item.away_name}</Text>
                  </View>
                {item.status === 'finished' && (
                  <View style={s.finishedBadge}><Text style={s.finishedBadgeText}>✓</Text></View>
                )}
              </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#0a0a0f' },
  header:        { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  title:         { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:           { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  tabs:          { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:           { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:     { backgroundColor: '#00d4ff' },
  tabText:       { fontSize: 12, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  tabTextActive: { color: '#000' },
  loader:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tableHeader:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  legendRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendText:    { fontSize: 9, color: '#8888aa', marginLeft: 4 },
  thPos:         { width: 24, fontSize: 9, color: '#8888aa', textAlign: 'center' },
  th:            { width: 24, fontSize: 9, color: '#8888aa', textAlign: 'center' },
  thPts:         { width: 28, fontSize: 9, color: '#8888aa', textAlign: 'center', fontWeight: '900' },
  posIndicator:  { width: 3, height: 36, borderRadius: 2, marginRight: 4 },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  rowMe:         { backgroundColor: '#00d4ff15' },
  pos:           { width: 24, fontSize: 12, color: '#8888aa', textAlign: 'center', fontWeight: '700' },
  clubCell:      { flex: 1, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  clubName:      { fontSize: 12, color: '#fff', fontWeight: '600' },
  cell:          { width: 24, fontSize: 11, color: '#8888aa', textAlign: 'center' },
  pts:           { width: 28, fontSize: 13, color: '#00d4ff', textAlign: 'center', fontWeight: '900' },
  textMe:        { color: '#00d4ff' },
  roundNav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 20 },
  roundBtn:      { width: 36, height: 36, backgroundColor: '#12121a', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roundBtnText:  { fontSize: 20, color: '#00d4ff', fontWeight: '900' },
  roundLabel:    { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  matchList:     { padding: 12, gap: 8 },
  matchCard:     { backgroundColor: '#12121a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff10' },
  matchCardMe:   { borderColor: '#00d4ff40', backgroundColor: '#00d4ff08' },
  matchTeam:     { flex: 1, alignItems: 'center', gap: 4 },
  matchTeamRight:{ alignItems: 'center' },
  matchTeamName: { fontSize: 10, color: '#fff', fontWeight: '600', textAlign: 'center' },
  matchScore:    { alignItems: 'center', paddingHorizontal: 8 },
  scoreText:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  scoreVs:       { fontSize: 14, fontWeight: '900', color: '#00d4ff' },
  scoreDate:      { fontSize: 10, color: '#8888aa', marginTop: 2 },
  playBadge:      { backgroundColor: '#00d4ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'center' },
  playBadgeText:  { fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 1 },
  finishedBadge:  { backgroundColor: '#00ff8820', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'center' },
  finishedBadgeText: { fontSize: 9, fontWeight: '900', color: '#00ff88' },
});
