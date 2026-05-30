import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { loadSession, loadManagerData } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';

const DAYS_INFO = [
  { day: 1, date: '19 июля', matches: [{match: 1, opponentName: 'Preston North End'}, {match: 2, opponentName: 'QPR'}] },
  { day: 2, date: '23 июля', matches: [{match: 1, opponentName: 'Stoke City'}, {match: 2, opponentName: 'Portsmouth'}] },
  { day: 3, date: '27 июля', matches: [{match: 1, opponentName: 'Charlton Athletic'}, {match: 2, opponentName: 'Blackburn Rovers'}] },
];

export default function PreseasonScreen({ navigation }) {
  const [club, setClub] = useState(null);
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState({});
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameYear, setGameYear] = useState(2026);
  const timerRef = useRef(null);

  useEffect(() => {
    init();
    timerRef.current = setInterval(refreshStatus, 60000);
    return () => clearInterval(timerRef.current);
  }, []);

  const init = async () => {
    const { token } = await loadSession();
    try {
      const state = await api.getGameState(token);
      if (state?.game_year) setGameYear(state.game_year);
    } catch(e) {}
    const { club } = await loadManagerData();
    setToken(token);
    setClub(club);
    await refreshStatus();
    if (token) {
      try {
        const saved = await api.getPreseasonResults(token);
        if (saved) setResults(saved);
      } catch (e) {}
    }
    setLoading(false);
  };

  const refreshStatus = async () => {
    try {
      const s = await api.getPreseasonStatus();
      setStatus(s);
    } catch (e) {}
  };

  const playMatch = async (day, match) => {
    const key = `${day}-${match}`;
    setPlaying(key);
    try {
      const res = await api.playPreseasonMatch(token, day, match);
      setResults(prev => ({ ...prev, [key]: res }));
    } catch (e) {}
    finally { setPlaying(null); }
  };

  const formatHours = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)} мин`;
    if (hours < 24) return `${Math.round(hours)} ч`;
    return `${Math.floor(hours / 24)} д ${Math.round(hours % 24)} ч`;
  };

  if (loading) {
    return <View style={s.screen}><ActivityIndicator size="large" color="#00d4ff" /></View>;
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.title}>ПРЕДСЕЗОНКА</Text>
          <Text style={s.sub}>ИЮЛЬ {gameYear} · 3 ДНЯ</Text>
        </View>
      </View>

      {/* Таймер до сезона */}
      {status && !status.season_started && (
        <View style={s.timerBox}>
          <Text style={s.timerLabel}>ДО СТАРТА СЕЗОНА</Text>
          <Text style={s.timerValue}>{formatHours(status.hours_until_season)}</Text>
          <Text style={s.timerNote}>Сезон стартует для всех одновременно</Text>
        </View>
      )}

      {status?.season_started && (
        <View style={[s.timerBox, { backgroundColor: '#00ff8820', borderColor: '#00ff8840' }]}>
          <Text style={[s.timerValue, { color: '#00ff88' }]}>🏆 СЕЗОН НАЧАЛСЯ!</Text>
          <TouchableOpacity style={s.startBtn} onPress={() => navigation.replace('Main')}>
            <Text style={s.startBtnText}>ПЕРЕЙТИ В СЕЗОН</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={s.list}>
        {DAYS_INFO.map(dayInfo => {
          const available = status?.available_days?.includes(dayInfo.day);
          return (
            <View key={dayInfo.day} style={[s.dayCard, !available && s.dayCardLocked]}>
              <View style={s.dayHeader}>
                <View style={s.dayTitleRow}>
                  <Text style={[s.dayTitle, !available && s.dimmed]}>ДЕНЬ {dayInfo.day}</Text>
                  <Text style={[s.dayDate, !available && s.dimmed]}>{dayInfo.date}</Text>
                </View>
                {!available && <Text style={s.lockIcon}>🔒</Text>}
                {available && <View style={s.availableBadge}><Text style={s.availableText}>ДОСТУПЕН</Text></View>}
              </View>

              {dayInfo.matches.map(m => {
                const key = `${dayInfo.day}-${m.match}`;
                const result = results[key];
                const isPlaying = playing === key;

                return (
                  <View key={key} style={s.matchRow}>
                    <View style={s.matchTeams}>
                      <Text style={s.matchTeam} numberOfLines={1}>{club?.name}</Text>
                      {result ? (
                        <Text style={s.matchResult}>{result.home_score} - {result.away_score}</Text>
                      ) : (
                        <Text style={s.matchVs}>VS</Text>
                      )}
                      <Text style={s.matchTeam} numberOfLines={1}>{m.opponentName}</Text>
                    </View>

                    {available && !result && (
                      <TouchableOpacity
                        style={[s.playBtn, isPlaying && s.playBtnDisabled]}
                        disabled={isPlaying || !!playing}
                        onPress={() => playMatch(dayInfo.day, m.match)}
                      >
                        {isPlaying
                          ? <ActivityIndicator size="small" color="#000" />
                          : <Text style={s.playBtnText}>▶ ИГРАТЬ</Text>
                        }
                      </TouchableOpacity>
                    )}

                    {result && (
                      <View style={s.doneBadge}>
                        <Text style={s.doneText}>
                          {result.home_score > result.away_score ? '✓ ПОБЕДА' :
                           result.home_score < result.away_score ? '✗ ПОРАЖЕНИЕ' : '= НИЧЬЯ'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#0a0a0f' },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn:         { width: 36, height: 36, backgroundColor: '#12121a', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backText:        { fontSize: 18, color: '#00d4ff', fontWeight: '900' },
  title:           { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:             { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 2 },
  timerBox:        { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#00d4ff15', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#00d4ff30' },
  timerLabel:      { fontSize: 10, color: '#8888aa', letterSpacing: 2, marginBottom: 4 },
  timerValue:      { fontSize: 24, fontWeight: '900', color: '#00d4ff' },
  timerNote:       { fontSize: 10, color: '#8888aa', marginTop: 4, textAlign: 'center' },
  startBtn:        { backgroundColor: '#00ff88', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: 10 },
  startBtnText:    { color: '#000', fontWeight: '900', letterSpacing: 2 },
  list:            { padding: 16, gap: 12 },
  dayCard:         { backgroundColor: '#12121a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#ffffff10' },
  dayCardLocked:   { opacity: 0.5 },
  dayHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayTitleRow:     { gap: 4 },
  dayTitle:        { fontSize: 14, fontWeight: '900', color: '#00d4ff', letterSpacing: 2 },
  dayDate:         { fontSize: 11, color: '#8888aa' },
  lockIcon:        { fontSize: 20 },
  availableBadge:  { backgroundColor: '#00d4ff20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  availableText:   { fontSize: 9, color: '#00d4ff', fontWeight: '900', letterSpacing: 1 },
  dimmed:          { color: '#555' },
  matchRow:        { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#ffffff08' },
  matchTeams:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  matchTeam:       { flex: 1, fontSize: 11, color: '#fff', fontWeight: '600', textAlign: 'center' },
  matchVs:         { fontSize: 14, color: '#8888aa', fontWeight: '700', paddingHorizontal: 8 },
  matchResult:     { fontSize: 18, fontWeight: '900', color: '#ffd700', paddingHorizontal: 8 },
  playBtn:         { backgroundColor: '#00d4ff', borderRadius: 8, padding: 10, alignItems: 'center' },
  playBtnDisabled: { opacity: 0.5 },
  playBtnText:     { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  doneBadge:       { borderRadius: 8, padding: 8, alignItems: 'center', backgroundColor: '#ffffff08' },
  doneText:        { fontSize: 11, fontWeight: '900', color: '#00ff88', letterSpacing: 1 },
});
