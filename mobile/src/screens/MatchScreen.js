import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';
import { C, FX } from '../design/theme';

export default function MatchScreen({ route }) {
  const { fixtureId } = route.params;
  const user = useAuthStore((s) => s.user);
  const myClubId = user?.manager?.clubId;

  const [match, setMatch] = useState(null);
  const [clubsMap, setClubsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [minute, setMinute] = useState(0);
  const [dispH, setDispH] = useState(0);
  const [dispA, setDispA] = useState(0);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/matches/${fixtureId}`);
        setMatch(data);
        const { data: clubs } = await api.get('/clubs');
        setClubsMap(Object.fromEntries(clubs.map(c => [c.id, c])));
        if (data.result) startAnim(data);
        else setPhase('done');
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const startAnim = (data) => {
    const tH = data.result.home, tA = data.result.away;
    const rand = (n) => Array(n).fill(0)
      .map(() => Math.floor(Math.random() * 85) + 5)
      .sort((a, b) => a - b);
    const hMins = rand(tH), aMins = rand(tA);
    let m = 0, cH = 0, cA = 0;
    setPhase('playing');

    const iv = setInterval(() => {
      m += 3;
      setMinute(Math.min(m, 90));
      while (hMins.length && m >= hMins[0]) {
        hMins.shift(); cH++;
        setDispH(cH);
        addLog(`${m}'`, '⚽', `ГОЛ! ${data.home.shortName}`, 'goal');
      }
      while (aMins.length && m >= aMins[0]) {
        aMins.shift(); cA++;
        setDispA(cA);
        addLog(`${m}'`, '⚽', `ГОЛ! ${data.away.shortName}`, 'goal');
      }
      if (m >= 90) {
        clearInterval(iv);
        setPhase('done');
        addLog("90'", '🏁', 'ФИНАЛЬНЫЙ СВИСТОК', 'end');
        if (data.result.homePens != null) {
          addLog('—', '🥅', `Серия пенальти: ${data.result.homePens}:${data.result.awayPens}`, 'info');
        }
      }
    }, 120);
  };

  const addLog = (min, icon, text, type) => {
    setLog(prev => [{ min, icon, text, type, id: Math.random() }, ...prev]);
  };

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );
  if (!match) return (
    <View style={[FX.bg, FX.center]}><Text style={{ color: C.muted }}>Матч не найден</Text></View>
  );

  const played = !!match.result;
  const isMH = match.home.id === myClubId;
  const isMA = match.away.id === myClubId;
  const scoreH = phase === 'playing' ? dispH : (match.result?.home ?? '');
  const scoreA = phase === 'playing' ? dispA : (match.result?.away ?? '');
  const homeData = { ...match.home, ...(clubsMap[match.home.id] || {}) };
  const awayData = { ...match.away, ...(clubsMap[match.away.id] || {}) };

  return (
    <View style={FX.bg}>
      {/* ТВ-полоса */}
      <View style={s.tv}>
        {phase === 'playing' ? (
          <View style={s.liveRow}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        ) : (
          <Text style={s.roundText}>ТУР {match.round}</Text>
        )}
        <Text style={s.compText}>
          {match.competition?.name?.replace(/ S\d+$/, '')}
        </Text>
      </View>

      {/* Табло */}
      <View style={s.board}>
        <View style={s.side}>
          <ClubBadge club={homeData} size={60} />
          <Text style={[s.tName, isMH && { color: C.green }]} numberOfLines={2}>
            {match.home.name.toUpperCase()}
          </Text>
        </View>

        <View style={s.center}>
          <View style={s.timerBox}>
            <Text style={s.timerText}>
              {phase === 'done' ? "90'" : phase === 'playing' ? `${minute}'` : 'VS'}
            </Text>
          </View>
          {played && (
            <Text style={s.score}>
              <Text style={isMH ? s.scoreMe : s.scoreOpp}>{scoreH}</Text>
              <Text style={s.scoreDash}> — </Text>
              <Text style={isMA ? s.scoreMe : s.scoreOpp}>{scoreA}</Text>
            </Text>
          )}
        </View>

        <View style={s.side}>
          <ClubBadge club={awayData} size={60} />
          <Text style={[s.tName, isMA && { color: C.green }]} numberOfLines={2}>
            {match.away.name.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Лента */}
      <View style={s.logBox}>
        {!played ? (
          <View style={FX.center}>
            <Ionicons name="football-outline" size={40} color={C.subtle} />
            <Text style={s.noMatchText}>Матч ещё не сыгран</Text>
          </View>
        ) : log.length === 0 ? (
          <View style={FX.center}>
            <Text style={s.noMatchText}>Команды выходят на поле...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
            {log.map((item) => (
              <View key={item.id} style={[
                s.logRow,
                item.type === 'goal' && s.logGoal,
                item.type === 'end' && s.logEnd,
              ]}>
                <Text style={s.logMin}>{item.min}</Text>
                <Text style={s.logIcon}>{item.icon}</Text>
                <Text style={[
                  s.logText,
                  item.type === 'goal' && { color: C.text },
                  item.type === 'end' && { color: C.accent, textAlign: 'center', flex: 1, letterSpacing: 1 },
                  item.type === 'info' && { color: C.muted },
                ]}>{item.text}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tv: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  liveText: { color: C.red, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  roundText: { color: C.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  compText: { color: C.muted, fontSize: 11, letterSpacing: 0.5 },

  board: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14,
    marginHorizontal: 12, paddingVertical: 22, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  side: { flex: 1, alignItems: 'center', gap: 10 },
  tName: { color: C.muted, fontSize: 11, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },

  center: { width: 100, alignItems: 'center' },
  timerBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, marginBottom: 8,
    borderWidth: 1, borderColor: C.accent,
  },
  timerText: { color: C.accent, fontSize: 13, fontWeight: '800' },
  score: { fontSize: 36, fontWeight: '900' },
  scoreMe: { color: C.gold },
  scoreOpp: { color: C.text },
  scoreDash: { color: C.subtle, fontSize: 26, fontWeight: '300' },

  logBox: {
    flex: 1, backgroundColor: C.cardDeep, borderRadius: 14,
    margin: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12, borderRadius: 8, marginBottom: 6,
    borderLeftWidth: 3, borderLeftColor: C.subtle,
  },
  logGoal: { borderLeftColor: C.gold, backgroundColor: 'rgba(241,196,15,0.06)' },
  logEnd: { borderLeftWidth: 0, backgroundColor: 'rgba(79,195,247,0.06)', justifyContent: 'center' },
  logMin: { color: C.muted, fontSize: 12, fontWeight: '800', width: 32 },
  logIcon: { fontSize: 15, marginHorizontal: 8 },
  logText: { color: C.muted, fontSize: 13, fontWeight: '600', flex: 1 },

  noMatchText: { color: C.subtle, marginTop: 10, fontStyle: 'italic' },
});
