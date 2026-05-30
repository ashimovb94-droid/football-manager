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
  const [seasonLabel, setSeasonLabel] = useState('');
  const [cupWinner, setCupWinner] = useState(null);
  const [isPreseason, setIsPreseason] = useState(false);
  const navigation = useNavigation();

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { token } = await loadSession();
    const { club } = await loadManagerData();
    setToken(token);
    setClub(club);

    if (token) {
      try {
        const state = await api.getGameState(token);
        if (state?.season_label) setSeasonLabel(state.season_label);
        if (state?.phase === 'preseason') setIsPreseason(true);
        if (state?.cup_winner) setCupWinner(state.cup_winner);
      } catch(e) {}
    }

    const data = await api.getCupBracket();
    setBracket(data);
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
        <View style={s.team}>
          {match.home ? (
            <>
              <ClubBadge club={{ id: String(match.home.id), primary: match.home.primary, secondary: '#fff', name: match.home.name }} size={32} />
              <Text style={[s.teamName, mine && Number(match.home.id) === myClubId && s.teamNameMe]} numberOfLines={1}>{match.home.name}</Text>
            </>
          ) : <Text style={s.tbd}>TBD</Text>}
        </View>

        <View style={s.scoreBox}>
          {finished ? (
            <>
              <Text style={s.score}>{match.home_score} - {match.away_score}</Text>
              {match.penalties && <Text style={s.penalties}>пен. {match.penalties}</Text>}
              {match.winner && <Text style={[s.winnerTag, { color }]}>✓</Text>}
            </>
          ) : (
            <Text style={s.vs}>VS</Text>
          )}
          <Text style={s.matchDate}>{match.date?.slice(5)}</Text>
        </View>

        <View style={[s.team, s.teamRight]}>
          {match.away ? (
            <>
              <ClubBadge club={{ id: String(match.away.id), primary: match.away.primary, secondary: '#fff', name: match.away.name }} size={32} />
              <Text style={[s.teamName, mine && Number(match.away.id) === myClubId && s.teamNameMe]} numberOfLines={1}>{match.away.name}</Text>
            </>
          ) : <Text style={s.tbd}>TBD</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={s.screen}><ActivityIndicator size="large" color="#00d4ff" style={{ marginTop: 100 }} /></View>;
  }

  // Экран предсезонки
  if (isPreseason) {
    return (
      <View style={s.screen}>
        <View style={s.header}>
          <Ionicons name="trophy-outline" size={28} color="#ffd700" />
          <View>
            <Text style={s.title}>КУБОК АНГЛИИ</Text>
            <Text style={s.sub}>FA CUP · СЕЗОН {seasonLabel}</Text>
          </View>
        </View>
        <View style={s.preseasonScreen}>
          <Ionicons name="trophy" size={100} color="#ffd700" />
          <Text style={s.preseasonLabel}>ОБЛАДАТЕЛЬ КУБКА</Text>
          <Text style={s.preseasonWinner}>{cupWinner || '...'}</Text>
          <Text style={s.preseasonSub}>Новый розыгрыш стартует вместе с сезоном</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Ionicons name="trophy-outline" size={28} color="#ffd700" />
        <View>
          <Text style={s.title}>КУБОК АНГЛИИ</Text>
          <Text style={s.sub}>FA CUP · СЕЗОН {seasonLabel}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.roundsBar} contentContainerStyle={s.roundsContent}>
        {rounds.map(r => {
          const hasMatches = bracket.some(m => m.round === r);
          return (
            <TouchableOpacity
              key={r}
              style={[s.roundBtn, activeRound === r && s.roundBtnActive, !hasMatches && s.roundBtnDisabled]}
              onPress={() => hasMatches && setActiveRound(r)}
            >
              <Text style={[s.roundText, activeRound === r && s.roundTextActive]}>{ROUND_NAMES[r]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={s.list}>
        {roundMatches.map(renderMatch)}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:             { flex: 1, backgroundColor: '#0a0a0f' },
  header:             { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title:              { fontSize: 22, fontWeight: '900', color: '#ffd700', letterSpacing: 2 },
  sub:                { fontSize: 10, color: '#8888aa', letterSpacing: 1 },
  preseasonScreen:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  preseasonLabel:     { fontSize: 12, color: '#8888aa', letterSpacing: 3 },
  preseasonWinner:    { fontSize: 28, fontWeight: '900', color: '#ffd700', textAlign: 'center' },
  preseasonSub:       { fontSize: 13, color: '#8888aa', textAlign: 'center', lineHeight: 20 },
  roundsBar:          { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  roundsContent:      { paddingHorizontal: 16, gap: 8, alignItems: 'center', height: 48 },
  roundBtn:           { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15' },
  roundBtnActive:     { backgroundColor: '#ffd700', borderColor: '#ffd700' },
  roundBtnDisabled:   { opacity: 0.3 },
  roundText:          { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  roundTextActive:    { color: '#000' },
  list:               { padding: 12, gap: 10 },
  matchCard:          { backgroundColor: '#12121a', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff10' },
  matchCardMe:        { borderColor: '#ffd70050', backgroundColor: '#ffd70008' },
  matchCardFinished:  { borderColor: '#ffffff20' },
  team:               { flex: 1, alignItems: 'center', gap: 6 },
  teamRight:          { alignItems: 'center' },
  teamName:           { fontSize: 10, fontWeight: '600', color: '#fff', textAlign: 'center' },
  teamNameMe:         { color: '#ffd700', fontWeight: '900' },
  tbd:                { fontSize: 12, color: '#8888aa', fontWeight: '700' },
  scoreBox:           { alignItems: 'center', paddingHorizontal: 12, gap: 2 },
  score:              { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  penalties:          { fontSize: 9, color: '#ffd700', fontWeight: '700' },
  winnerTag:          { fontSize: 10, fontWeight: '900' },
  vs:                 { fontSize: 14, fontWeight: '900', color: '#8888aa', letterSpacing: 2 },
  matchDate:          { fontSize: 9, color: '#8888aa' },
});
