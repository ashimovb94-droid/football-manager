import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { loadSession } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';

const EVENT_ICONS = {
  goal:         '⚽',
  yellow_card:  '🟨',
  red_card:     '🟥',
  substitution: '🔄',
  chance:       '💨',
  attack:       '➡️',
  neutral:      '📋',
  kickoff:      '⚽',
  fulltime:     '⏱',
};

const EVENT_COLORS = {
  goal:         '#ffd700',
  yellow_card:  '#ffd700',
  red_card:     '#ff3355',
  substitution: '#00d4ff',
  chance:       '#ff6b35',
  attack:       '#8888aa',
  neutral:      '#555',
  kickoff:      '#00ff88',
  fulltime:     '#00ff88',
};

export default function MatchScreen({ route, navigation }) {
  const { matchId, homeClub, awayClub, isFriendly, opponentId } = route.params || {};
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [displayScore, setDisplayScore] = useState({ home: 0, away: 0 });
  const [finished, setFinished] = useState(false);
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    playMatch();
    return () => clearInterval(timerRef.current);
  }, []);

  const playMatch = async () => {
    try {
      const { token } = await loadSession();
      let res;
      if (isFriendly) {
        res = await api.playFriendly(token, opponentId);
      } else {
        res = await api.playMatch(token, matchId);
      }
      setResult(res);
      setLoading(false);
      startCommentary(res);
    } catch (e) {
      setLoading(false);
    }
  };

  const startCommentary = (res) => {
    if (!res?.events?.length) {
      setFinished(true);
      return;
    }

    let idx = 0;
    let homeScore = 0;
    let awayScore = 0;

    timerRef.current = setInterval(() => {
      if (idx >= res.events.length) {
        clearInterval(timerRef.current);
        setFinished(true);
        return;
      }

      const event = res.events[idx];
      setCurrentMinute(event.minute);
      setVisibleEvents(prev => [event, ...prev]);

      if (event.type === 'goal') {
        if (event.team === 'home') homeScore++;
        else awayScore++;
        setDisplayScore({ home: homeScore, away: awayScore });
        Animated.sequence([
          Animated.timing(scoreAnim, { toValue: 1.4, duration: 200, useNativeDriver: true }),
          Animated.timing(scoreAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }

      idx++;
    }, event => {
      const e = res.events[idx];
      return e?.type === 'goal' ? 1500 : e?.type === 'chance' ? 800 : 500;
    });

    // Простой вариант с фиксированным интервалом
    clearInterval(timerRef.current);
    timerRef.current = null;

    let i = 0;
    let hs = 0;
    let as_ = 0;

    const tick = () => {
      if (i >= res.events.length) {
        setFinished(true);
        return;
      }
      const ev = res.events[i];
      setCurrentMinute(ev.minute);
      setVisibleEvents(prev => [ev, ...prev]);

      if (ev.type === 'goal') {
        if (ev.team === 'home') hs++;
        else as_++;
        setDisplayScore({ home: hs, away: as_ });
        Animated.sequence([
          Animated.timing(scoreAnim, { toValue: 1.4, duration: 200, useNativeDriver: true }),
          Animated.timing(scoreAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }

      i++;
      const delay = ev.type === 'goal' ? 1800
                  : ev.type === 'chance' ? 900
                  : ev.type === 'yellow_card' ? 900
                  : ev.type === 'fulltime' ? 1000
                  : 500;
      setTimeout(tick, delay);
    };

    setTimeout(tick, 800);
  };

  if (loading) {
    return (
      <View style={s.screen}>
        <Text style={s.loadingText}>⚽ Загружаем матч...</Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      {/* Шапка */}
      <View style={s.header}>
        <Text style={s.competition}>
          {result?.is_friendly ? '🤝 ТОВАРИЩЕСКИЙ' : '🏆 ЧЕМПИОНШИП'} · {currentMinute}'
        </Text>

        <View style={s.scoreRow}>
          <View style={s.teamSide}>
            <ClubBadge club={homeClub} size={44} />
            <Text style={s.teamName} numberOfLines={1}>{result?.home_name}</Text>
          </View>

          <Animated.View style={[s.scoreBox, { transform: [{ scale: scoreAnim }] }]}>
            <Text style={s.scoreText}>{displayScore.home} - {displayScore.away}</Text>
            {!finished && <Text style={s.liveTag}>LIVE</Text>}
            {finished && <Text style={s.ftTag}>ФИНАЛ</Text>}
          </Animated.View>

          <View style={s.teamSide}>
            <ClubBadge club={awayClub} size={44} />
            <Text style={s.teamName} numberOfLines={1}>{result?.away_name}</Text>
          </View>
        </View>

        <View style={s.xgRow}>
          <Text style={s.xg}>xG {result?.home_xg}</Text>
          <Text style={s.xgLabel}>ОЖИДАЕМЫЕ ГОЛЫ</Text>
          <Text style={s.xg}>{result?.away_xg}</Text>
        </View>
      </View>

      {/* Трансляция */}
      <ScrollView
        ref={scrollRef}
        style={s.feed}
        contentContainerStyle={s.feedContent}
      >
        {visibleEvents.map((event, i) => {
          const color = EVENT_COLORS[event.type] || '#8888aa';
          const isGoal = event.type === 'goal';
          const isCard = event.type === 'yellow_card' || event.type === 'red_card';
          const isHome = event.team === 'home';

          return (
            <View key={i} style={[
              s.eventRow,
              isGoal && s.eventGoal,
              isCard && s.eventCard,
            ]}>
              <View style={s.eventLeft}>
                <Text style={[s.eventMinute, { color }]}>{event.minute}'</Text>
                <Text style={s.eventIcon}>{EVENT_ICONS[event.type] || '·'}</Text>
              </View>

              <View style={s.eventBody}>
                {event.player && (
                  <Text style={[s.eventPlayer, isGoal && { color: '#ffd700', fontSize: 15 }]}>
                    {isHome ? '🏠 ' : '✈️ '}{event.player}
                    {event.score && <Text style={s.eventScore}> ({event.score})</Text>}
                  </Text>
                )}
                <Text style={[s.eventComment, { color: isGoal ? '#fff' : '#aaa' }]}>
                  {event.comment}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Кнопка назад */}
      {finished && (
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← НАЗАД</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#0a0a0f' },
  loadingText:  { color: '#fff', fontSize: 20, textAlign: 'center', marginTop: 200 },
  header:       { backgroundColor: '#12121a', padding: 16, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  competition:  { fontSize: 10, color: '#8888aa', letterSpacing: 2, textAlign: 'center', marginBottom: 12 },
  scoreRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamSide:     { flex: 1, alignItems: 'center', gap: 6 },
  teamName:     { fontSize: 10, fontWeight: '700', color: '#fff', textAlign: 'center' },
  scoreBox:     { alignItems: 'center', paddingHorizontal: 12 },
  scoreText:    { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  liveTag:      { fontSize: 9, color: '#ff3355', fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  ftTag:        { fontSize: 9, color: '#00ff88', fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  xgRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ffffff10' },
  xg:           { fontSize: 13, fontWeight: '900', color: '#8888aa' },
  xgLabel:      { fontSize: 9, color: '#8888aa', letterSpacing: 1 },
  feed:         { flex: 1 },
  feedContent:  { padding: 12, gap: 6 },
  eventRow:     { backgroundColor: '#12121a', borderRadius: 10, padding: 10, flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#ffffff08' },
  eventGoal:    { backgroundColor: '#ffd70015', borderColor: '#ffd70040' },
  eventCard:    { backgroundColor: '#ffd70010', borderColor: '#ffd70030' },
  eventLeft:    { alignItems: 'center', width: 36 },
  eventMinute:  { fontSize: 11, fontWeight: '900' },
  eventIcon:    { fontSize: 16, marginTop: 2 },
  eventBody:    { flex: 1 },
  eventPlayer:  { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 2 },
  eventScore:   { fontSize: 11, color: '#ffd700', fontWeight: '700' },
  eventComment: { fontSize: 11, lineHeight: 16 },
  backBtn:      { margin: 12, backgroundColor: '#12121a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  backBtnText:  { color: '#00d4ff', fontWeight: '800', letterSpacing: 2 },
});
