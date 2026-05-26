import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ImageBackground, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';

const { width: W } = Dimensions.get('window');
const STADIUM = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80';

const C = {
  bg:     '#0d1117',
  card:   'rgba(22, 30, 43, 0.85)',
  border: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(79,195,247,0.3)',
  accent: '#4fc3f7',
  green:  '#2ecc71',
  gold:   '#f1c40f',
  red:    '#e74c3c',
  muted:  '#7a8a9e',
  subtle: '#3a4558',
  text:   '#fff'
};

const MAX_ROUND = 38;

export default function FixturesScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const myClubId = user?.manager?.clubId;

  const [leagues, setLeagues] = useState([]);
  const [activeCompId, setActiveCompId] = useState(null);
  const [filter, setFilter] = useState('my');           // my | all
  const [round, setRound] = useState(1);                // только для filter='all'
  const [currentRound, setCurrentRound] = useState(1);  // ближайший несыгранный тур турнира
  const [fixtures, setFixtures] = useState([]);
  const [clubsMap, setClubsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Грузим лиги и клубы — один раз
  const loadInit = useCallback(async () => {
    try {
      const { data: comps } = await api.get('/competitions');
      const lgs = comps.filter(c => c.type === 'LEAGUE').sort((a, b) => a.tier - b.tier);
      setLeagues(lgs);
      if (lgs.length) setActiveCompId(lgs[0].id);
      const { data: clubs } = await api.get('/clubs');
      setClubsMap(Object.fromEntries(clubs.map(c => [c.id, c])));
    } catch {}
  }, []);

  useEffect(() => { loadInit(); }, [loadInit]);

  // При смене лиги: подтянуть currentRound и установить round
  useEffect(() => {
    if (!activeCompId) return;
    (async () => {
      try {
        const { data: cr } = await api.get(`/competitions/${activeCompId}/current-round`);
        const nr = cr.nextRound || MAX_ROUND;
        setCurrentRound(nr);
        setRound(nr); // при смене лиги — открываем текущий тур
      } catch {}
    })();
  }, [activeCompId]);

  // Загрузка списка матчей — реагирует на filter, round, activeCompId
  const reloadFixtures = useCallback(async () => {
    if (!activeCompId) return;
    setLoading(true);
    try {
      if (filter === 'my') {
        const { data } = await api.get(`/competitions/${activeCompId}/fixtures`);
        const mine = data.filter(f => f.home.id === myClubId || f.away.id === myClubId);
        setFixtures(mine);
      } else {
        const { data } = await api.get(`/competitions/${activeCompId}/fixtures?round=${round}`);
        setFixtures(data);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [activeCompId, filter, round, myClubId]);

  useEffect(() => { reloadFixtures(); }, [reloadFixtures]);

  // Авто-обновление при возврате на экран + раз в 60с пока в фокусе
  useEffect(() => {
    let iv = null;
    const start = navigation.addListener('focus', () => {
      reloadFixtures();
      iv = setInterval(reloadFixtures, 60000);
    });
    const stop = navigation.addListener('blur', () => {
      if (iv) { clearInterval(iv); iv = null; }
    });
    return () => { start(); stop(); if (iv) clearInterval(iv); };
  }, [navigation, reloadFixtures]);

  const isLastRound = round >= MAX_ROUND;
  const isFirstRound = round <= 1;

  return (
    <ImageBackground source={{ uri: STADIUM }} style={s.bg} imageStyle={{ opacity: 0.35 }}>
      <View style={s.dark} />
      
      {/* Мои / Турнир */}
      <View style={s.switcher}>
        <TouchableOpacity style={s.switchBtn} onPress={() => setFilter('my')} activeOpacity={0.7}>
          <Text style={[s.switchText, filter === 'my' && s.switchActive]}>МОИ МАТЧИ</Text>
          {filter === 'my' && <View style={s.switchUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={s.switchBtn} onPress={() => setFilter('all')} activeOpacity={0.7}>
          <Text style={[s.switchText, filter === 'all' && s.switchActive]}>ТУРНИР</Text>
          {filter === 'all' && <View style={s.switchUnderline} />}
        </TouchableOpacity>
      </View>

      {/* Переключатель лиг */}
      {leagues.length > 1 && (
        <View style={s.leagueTabs}>
          {leagues.map(lg => (
            <TouchableOpacity
              key={lg.id}
              style={[s.leagueTab, activeCompId === lg.id && s.leagueTabActive]}
              onPress={() => setActiveCompId(lg.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.leagueTabText, activeCompId === lg.id && s.leagueTabTextActive]}>
                {lg.tier === 1 ? 'АПЛ' : 'ЧЕМПИОНШИП'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Навигация по турам (только Турнир) */}
      {filter === 'all' && (
        <View style={s.roundNav}>
          <TouchableOpacity
            onPress={() => setRound(r => Math.max(1, r - 1))}
            disabled={isFirstRound}
            style={s.navBtn}
          >
            <Ionicons name="chevron-back" size={22} color={isFirstRound ? C.subtle : C.accent} />
          </TouchableOpacity>
          <Text style={s.roundNavText}>ТУР {round} ИЗ {MAX_ROUND}</Text>
          <TouchableOpacity
            onPress={() => setRound(r => Math.min(MAX_ROUND, r + 1))}
            disabled={isLastRound}
            style={s.navBtn}
          >
            <Ionicons name="chevron-forward" size={22} color={isLastRound ? C.subtle : C.accent} />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={s.centerBlock}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={fixtures}
          keyExtractor={(f) => f.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reloadFixtures(); }} tintColor={C.accent} />}
          ListEmptyComponent={<Text style={s.empty}>Матчей нет</Text>}
          renderItem={({ item }) => {
            const isMine = item.home.id === myClubId || item.away.id === myClubId;
            const played = item.status === 'PLAYED' && item.result;
            // Подсвечиваем зелёным только МОИ матчи И только если ещё не сыграны И это текущий тур турнира
            const highlight = isMine && !played && item.round === currentRound;

            return (
              <TouchableOpacity
                style={[
                  s.matchCard,
                  isMine && s.matchMine,
                  highlight && s.matchHighlight,
                ]}
                onPress={() => navigation.navigate('Match', { fixtureId: item.id })}
                disabled={!played}
                activeOpacity={0.7}
              >
                <View style={s.roundBadge}>
                  <Text style={s.roundBadgeText}>ТУР {item.round}</Text>
                </View>

                <View style={s.teamsRow}>
                  <View style={s.teamSide}>
                    <ClubBadge club={{ ...item.home, ...(clubsMap[item.home.id] || {}) }} size={40} />
                    <Text style={s.teamName} numberOfLines={1}>{item.home.name}</Text>
                  </View>

                  <View style={s.scoreBox}>
                    {played ? (
                      <Text style={s.scoreText}>{item.result.home} : {item.result.away}</Text>
                    ) : highlight ? (
                      <Text style={s.skoroText}>СКОРО</Text>
                    ) : (
                      <Text style={s.vsText}>VS</Text>
                    )}
                  </View>

                  <View style={s.teamSide}>
                    <ClubBadge club={{ ...item.away, ...(clubsMap[item.away.id] || {}) }} size={40} />
                    <Text style={s.teamName} numberOfLines={1}>{item.away.name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg:     { flex: 1, backgroundColor: C.bg },
  dark:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 14, 23, 0.75)' },
  centerBlock: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  switcher: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 16 },
  switchBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  switchText: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  switchActive: { color: C.accent },
  switchUnderline: { height: 2, backgroundColor: C.accent, width: '60%', marginTop: 6, borderRadius: 1 },

  leagueTabs: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  leagueTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'transparent' },
  leagueTabActive: { borderBottomColor: C.green },
  leagueTabText: { color: C.subtle, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  leagueTabTextActive: { color: C.green },

  roundNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 30, paddingVertical: 10,
  },
  navBtn: { padding: 8 },
  roundNavText: { color: C.text, fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  matchCard: {
    backgroundColor: C.card, borderRadius: 12,
    padding: 14, paddingTop: 22, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  matchMine: { borderColor: C.borderActive },
  matchHighlight: { borderColor: C.green, backgroundColor: 'rgba(46,204,113,0.06)' },

  roundBadge: {
    position: 'absolute', top: 8, left: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  roundBadgeText: { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  teamsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  teamSide: { flex: 1, alignItems: 'center', gap: 8 },
  teamName: { color: C.text, fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },

  scoreBox: { width: 80, alignItems: 'center' },
  scoreText: { color: C.gold, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  skoroText: { color: C.green, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  vsText: { color: C.muted, fontSize: 14, fontWeight: '800', letterSpacing: 2 },

  empty: { color: C.subtle, textAlign: 'center', padding: 30 },
});
