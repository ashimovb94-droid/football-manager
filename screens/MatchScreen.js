import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal } from 'react-native';
import { loadSession, loadManagerData } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';

const EVENT_ICONS = {
  goal:        '⚽',
  yellow_card: '🟨',
  red_card:    '🟥',
  substitution:'🔄',
};

export default function MatchScreen({ route, navigation }) {
  const { matchId, homeClub, awayClub, isFriendly, opponentId } = route.params || {};
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEvents, setShowEvents] = useState(false);
  const [displayScore, setDisplayScore] = useState({ home: 0, away: 0 });
  const [currentEvent, setCurrentEvent] = useState(null);
  const scoreAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    playMatch();
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
      animateScore(res);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const animateScore = (res) => {
    if (!res?.events) return;
    let homeScore = 0;
    let awayScore = 0;
    let delay = 500;

    res.events.forEach((event, i) => {
      setTimeout(() => {
        setCurrentEvent(event);
        if (event.type === 'goal') {
          if (event.team === 'home') homeScore++;
          else awayScore++;
          setDisplayScore({ home: homeScore, away: awayScore });
          Animated.sequence([
            Animated.timing(scoreAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.timing(scoreAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
        if (i === res.events.length - 1) {
          setTimeout(() => {
            setCurrentEvent(null);
            setShowEvents(true);
          }, 1500);
        }
      }, delay);
      delay += event.type === 'goal' ? 1200 : 600;
    });

    if (!res.events.length) {
      setTimeout(() => setShowEvents(true), 1000);
    }
  };

  if (loading) {
    return (
      <View style={s.screen}>
        <Text style={s.loadingText}>⚽ Матч идёт...</Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      {/* Шапка матча */}
      <View style={s.matchHeader}>
        <Text style={s.competition}>
          {result?.is_friendly ? '🤝 ТОВАРИЩЕСКИЙ МАТЧ' : '🏆 ЧЕМПИОНШИП'}
        </Text>

        <View style={s.scoreRow}>
          <View style={s.teamSide}>
            <ClubBadge club={homeClub} size={48} />
            <Text style={s.teamName} numberOfLines={2}>{result?.home_name}</Text>
          </View>

          <Animated.View style={[s.scoreBox, { transform: [{ scale: scoreAnim }] }]}>
            <Text style={s.scoreText}>{displayScore.home} - {displayScore.away}</Text>
            {!showEvents && currentEvent && (
              <Text style={s.currentEventText}>
                {EVENT_ICONS[currentEvent.type]} {currentEvent.minute}'
              </Text>
            )}
          </Animated.View>

          <View style={s.teamSide}>
            <ClubBadge club={awayClub} size={48} />
            <Text style={s.teamName} numberOfLines={2}>{result?.away_name}</Text>
          </View>
        </View>

        {/* xG */}
        <View style={s.xgRow}>
          <Text style={s.xg}>xG {result?.home_xg}</Text>
          <Text style={s.xgLabel}>ОЖИДАЕМЫЕ ГОЛЫ</Text>
          <Text style={s.xg}>{result?.away_xg}</Text>
        </View>
      </View>

      {/* Текущее событие */}
      {!showEvents && currentEvent && (
        <View style={s.eventBanner}>
          <Text style={s.eventBannerIcon}>{EVENT_ICONS[currentEvent.type]}</Text>
          <View>
            <Text style={s.eventBannerText}>
              {currentEvent.type === 'goal' ? 'ГОЛ!' : 'КАРТОЧКА'}
            </Text>
            <Text style={s.eventBannerPlayer}>{currentEvent.player} {currentEvent.minute}'</Text>
          </View>
        </View>
      )}

      {/* События матча */}
      {showEvents && (
        <ScrollView style={s.events} contentContainerStyle={s.eventsList}>
          <Text style={s.eventsTitle}>СОБЫТИЯ МАТЧА</Text>
          {result?.events?.map((event, i) => (
            <View key={i} style={[s.eventRow, event.team === 'home' ? s.eventHome : s.eventAway]}>
              {event.team === 'away' && <View style={{ flex: 1 }} />}
              <View style={[s.eventCard, event.team === 'home' ? s.eventCardHome : s.eventCardAway]}>
                <Text style={s.eventMinute}>{event.minute}'</Text>
                <Text style={s.eventIcon}>{EVENT_ICONS[event.type]}</Text>
                <Text style={s.eventPlayer} numberOfLines={1}>{event.player}</Text>
              </View>
              {event.team === 'home' && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Кнопка назад */}
      {showEvents && (
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← НАЗАД</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen:            { flex: 1, backgroundColor: '#0a0a0f' },
  loadingText:       { color: '#fff', fontSize: 24, textAlign: 'center', marginTop: 200 },
  matchHeader:       { backgroundColor: '#12121a', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  competition:       { fontSize: 11, color: '#8888aa', letterSpacing: 2, textAlign: 'center', marginBottom: 16 },
  scoreRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamSide:          { flex: 1, alignItems: 'center', gap: 8 },
  teamName:          { fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center' },
  scoreBox:          { alignItems: 'center', paddingHorizontal: 16 },
  scoreText:         { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  currentEventText:  { fontSize: 12, color: '#00d4ff', marginTop: 4 },
  xgRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#ffffff10' },
  xg:                { fontSize: 14, fontWeight: '900', color: '#8888aa' },
  xgLabel:           { fontSize: 9, color: '#8888aa', letterSpacing: 1 },
  eventBanner:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffd70020', margin: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ffd70040' },
  eventBannerIcon:   { fontSize: 32 },
  eventBannerText:   { fontSize: 18, fontWeight: '900', color: '#ffd700' },
  eventBannerPlayer: { fontSize: 12, color: '#fff', marginTop: 2 },
  events:            { flex: 1 },
  eventsList:        { padding: 16 },
  eventsTitle:       { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  eventRow:          { flexDirection: 'row', marginBottom: 8 },
  eventHome:         { justifyContent: 'flex-start' },
  eventAway:         { justifyContent: 'flex-end' },
  eventCard:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#12121a', borderRadius: 8, padding: 8, maxWidth: '70%', borderWidth: 1 },
  eventCardHome:     { borderColor: '#00d4ff30' },
  eventCardAway:     { borderColor: '#ff335530' },
  eventMinute:       { fontSize: 10, color: '#8888aa', width: 24 },
  eventIcon:         { fontSize: 14 },
  eventPlayer:       { fontSize: 11, color: '#fff', fontWeight: '600', flex: 1 },
  backBtn:           { margin: 16, backgroundColor: '#12121a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  backBtnText:       { color: '#00d4ff', fontWeight: '800', letterSpacing: 2 },
});
