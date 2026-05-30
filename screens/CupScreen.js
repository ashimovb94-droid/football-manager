import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { loadManagerData, loadSession } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ROUND_NAMES = { 1: '1/32', 2: '1/16', 3: '1/8', 4: '1/4', 5: '1/2', 6: 'ФИНАЛ' };
const ROUND_COLORS = { 1: '#8888aa', 2: '#00d4ff', 3: '#7b2fff', 4: '#ff6b35', 5: '#ffd700', 6: '#00ff88' };

export default function CupScreen() {
  const [bracket, setBracket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState(null);
  const [token, setToken] = useState(null);
  const [activeRound, setActiveRound] = useState(1);
  const navigation = useNavigation();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { token } = await loadSession();
    const { club } = await loadManagerData();
    setToken(token);
    setClub(club);
    const data = await api.getCupBracket();
    setBracket(data);
    // Определяем активный раунд
    const scheduled = data.filter(m => m.status === 'scheduled');
    if (scheduled.length) setActiveRound(scheduled[0].round);
    setLoading(false);
  };

  const rounds = [1, 2, 3, 4, 5, 6];
  const roundMatches = bracket.filter(m => m.round === activeRound);
  const myClubId = club?.id ? Number(club.id) : null;

  const isMyMatch = (match) =>
    (match.home?.id && Number(match.home.id) === myClubId) ||
    (match.away?.id && Number(match.away.id) === myClubId);

  const renderMatch = (match) => {
    const mine = isMyMatch(match);
    const finished = match.status === 'finished';
    const color = ROUND_COLORS[match.round] || '#8888aa';

    return (
      <TouchableOpacity
        key={match.id}
        style={[s.matchCard, mine && s.matchCardMe, finished && s.matchCardFinished]}
        onPress={() => {
          if (mine && !finished) {
            navigation.navigate('Match', {
              matchId: match.id,
              isCup: true,
              homeClub: match.home ? { id: String(match.home.id), primary: match.home.primary, secondary: '#fff', name: match.home.name } : {},
              awayClub: match.away ? { id: String(match.away.id), primary: match.away.primary, secondary: '#fff', name: match.away.name } : {},
            });
          }
        }}
      >
        {/* Левая команда */}
        <View style={s.team}>
          {match.home ? (
            <>
              <ClubBadge club={{ id: String(match.home.id), primary: match.home.primary, secondary: '#fff', name: match.home.name }} size={32} />
              <Text style={[s.teamName, mine && Number(match.home.id) === myClubId && s.teamNameMe]} numberOfLines={1}>
                {match.home.name}
              </Text>
            </>
          ) : (
            <Text style={s.tbd}>TBD</Text>
          )}
        </View>

        {/* Счёт */}
        <View style={s.scoreBox}>
          {finished ? (
            <>
              <Text style={s.score}>{match.home_score} - {match.away_score}</Text>
              {match.penalties && (
                <Text style={s.penalties}>пен. {match.penalties}</Text>
              )}
              {match.winner && <Text style={[s.winnerTag, { color }]}>✓</Text>}
            </>
          ) : (
            <Text style={s.vs}>VS</Text>
          )}
          <Text style={s.matchDate}>{match.date?.slice(5)}</Text>
        </View>

        {/* Правая команда */}
        <View style={[s.team, s.teamRight]}>
          {match.away ? (
            <>
              <ClubBadge club={{ id: String(match.away.id), primary: match.away.primary, secondary: '#fff', name: match.away.name }} size={32} />
              <Text style={[s.teamName, mine && Number(match.away.id) === myClubId && s.teamNameMe]} numberOfLines={1}>
                {match.away.name}
              </Text>
            </>
          ) : (
            <Text style={s.tbd}>TBD</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={s.screen}><ActivityIndicator size="large" color="#ffd700" /></View>;
  }

  return (
    <View style={s.screen}>
      {/* Шапка */}
      <View style={s.header}>
        <Ionicons name='trophy-outline' size={40} color='#ffd700' />
        <View>
          <Text style={s.title}>КУБОК АНГЛИИ</Text>
          <Text style={s.sub}>FA CUP · СЕЗОН 2025/26</Text>
        </View>
      </View>

      {/* Раунды — закреплены */}
      <View style={s.roundTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.roundTabs}>
          {rounds.map(r => (
            <TouchableOpacity
              key={r}
              style={[s.roundTab, activeRound === r && { backgroundColor: ROUND_COLORS[r], borderColor: ROUND_COLORS[r] }]}
              onPress={() => setActiveRound(r)}
            >
              <Text style={[s.roundTabText, activeRound === r && s.roundTabTextActive]}>{ROUND_NAMES[r]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Матчи раунда */}
      <ScrollView contentContainerStyle={s.matchList}>
        {roundMatches.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Матчи этого раунда ещё не определены</Text>
          </View>
        ) : (
          roundMatches.map(renderMatch)
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:            { flex: 1, backgroundColor: '#0a0a0f' },
  header:            { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 56, paddingHorizontal: 24, paddingBottom: 12 },
  cupEmoji:          { fontSize: 40 },
  title:             { fontSize: 24, fontWeight: '900', color: '#ffd700', letterSpacing: 3 },
  sub:               { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginTop: 2 },
  roundTabsWrapper:   { backgroundColor: '#0a0a0f', borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  roundTabs:          { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  roundTab:          { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15', alignItems: 'center', justifyContent: 'center', height: 40 },
  roundTabText:      { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  roundTabTextActive:{ color: '#000' },
  matchList:         { padding: 12, gap: 8 },
  matchCard:         { backgroundColor: '#12121a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff10' },
  matchCardMe:       { borderColor: '#ffd70040', backgroundColor: '#ffd70008' },
  matchCardFinished: { opacity: 0.8 },
  team:              { flex: 1, alignItems: 'center', gap: 4 },
  teamRight:         { alignItems: 'center' },
  teamName:          { fontSize: 10, fontWeight: '600', color: '#fff', textAlign: 'center' },
  teamNameMe:        { color: '#ffd700', fontWeight: '900' },
  tbd:               { fontSize: 12, color: '#8888aa', fontStyle: 'italic' },
  scoreBox:          { alignItems: 'center', paddingHorizontal: 8, minWidth: 60 },
  score:             { fontSize: 18, fontWeight: '900', color: '#fff' },
  winnerTag:         { fontSize: 10, fontWeight: '900', marginTop: 2 },
  vs:                { fontSize: 14, fontWeight: '900', color: '#8888aa' },
  playBtn:           { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  playBtnText:       { fontSize: 12, color: '#000', fontWeight: '900' },
  matchDate:          { fontSize: 9, color: '#8888aa', marginTop: 3 },
  penalties:          { fontSize: 9, color: '#ffd700', fontWeight: '700', marginTop: 1 },
  empty:             { padding: 40, alignItems: 'center' },
  emptyText:         { color: '#8888aa', fontSize: 13, textAlign: 'center' },
});
