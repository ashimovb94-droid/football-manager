import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { loadManagerData, loadSession } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const getZone = (pos, league) => {
  if (league === 'championship') {
    if (pos <= 2)  return { label: 'ПОВЫШЕНИЕ В АПЛ!', color: '#00ff88', icon: 'arrow-up-circle-outline' };
    if (pos <= 6)  return { label: 'ПЛЕЙ-ОФФ', color: '#00d4ff', icon: 'git-branch-outline' };
    if (pos >= 22) return { label: 'ВЫЛЕТ', color: '#ff3355', icon: 'arrow-down-circle-outline' };
  } else {
    if (pos === 1) return { label: 'ЧЕМПИОН АПЛ! 🏆', color: '#ffd700', icon: 'trophy-outline' };
    if (pos <= 4)  return { label: 'ЛИГА ЧЕМПИОНОВ', color: '#ffd700', icon: 'trophy-outline' };
    if (pos <= 6)  return { label: 'ЛИГА ЕВРОПЫ', color: '#ff6b35', icon: 'medal-outline' };
    if (pos >= 18) return { label: 'ВЫЛЕТ', color: '#ff3355', icon: 'arrow-down-circle-outline' };
  }
  return { label: 'СЕЗОН ЗАВЕРШЁН', color: '#00d4ff', icon: 'checkmark-circle-outline' };
};

export default function SeasonResultScreen({ route }) {
  const { league, myClubId, pendingResults } = route?.params || {};
  const [results, setResults] = useState(null);
  const [club, setClub] = useState(null);
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiAnims = useRef([...Array(12)].map(() => ({
    x: new Animated.Value(Math.random() * 400 - 200),
    y: new Animated.Value(-50),
    opacity: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    const load = async () => {
      const { token } = await loadSession();
      const { club } = await loadManagerData();
      setClub(club);
      const r = await api.getSeasonResults(league || club?.league || 'epl');
      setResults(r);
      // Очищаем pending results
      if (token) await api.clearPendingResults(token);
    };
    load();

    // Анимация появления
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    // Конфетти
    confettiAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.y, { toValue: 800, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ]).start();
      }, i * 150);
    });
  }, []);

  const myResult = results?.standings?.find(s => Number(s.club_id) === Number(myClubId || club?.id));
  const myPos = myResult?.position;
  const zone = myPos ? getZone(myPos, league || 'epl') : null;

  const CONFETTI_COLORS = ['#ffd700','#00ff88','#00d4ff','#ff6b35','#ff3355','#7b2fff'];

  return (
    <View style={s.screen}>
      {/* Конфетти */}
      {confettiAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[s.confetti, {
            left: 50 + (i * 30) % 300,
            transform: [{ translateY: anim.y }, { translateX: anim.x }],
            opacity: anim.opacity,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          }]}
        />
      ))}

      <ScrollView contentContainerStyle={s.inner}>
        {/* Главный блок */}
        <Animated.View style={[s.heroCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }], borderColor: zone?.color || '#ffd700' }]}>
          <Ionicons name={zone?.icon || 'trophy-outline'} size={64} color={zone?.color || '#ffd700'} />
          <Text style={[s.heroTitle, { color: zone?.color || '#ffd700' }]}>{zone?.label || 'СЕЗОН ЗАВЕРШЁН'}</Text>
          {myResult && (
            <>
              <View style={s.heroRow}>
                <ClubBadge club={{ id: String(myResult.club_id), primary: club?.primary || '#333', secondary: '#fff', name: myResult.club_name }} size={48} />
                <View>
                  <Text style={s.heroClub}>{myResult.club_name}</Text>
                  <Text style={s.heroLeague}>{league === 'epl' ? 'АПЛ' : 'ЧЕМПИОНШИП'}</Text>
                </View>
              </View>
              <Text style={s.heroPos}>#{myPos} МЕСТО</Text>
              <View style={s.heroStats}>
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{myResult.points}</Text>
                  <Text style={s.heroStatLabel}>ОЧКОВ</Text>
                </View>
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{myResult.won}</Text>
                  <Text style={s.heroStatLabel}>ПОБЕД</Text>
                </View>
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{myResult.gf}</Text>
                  <Text style={s.heroStatLabel}>ГОЛОВ</Text>
                </View>
                <View style={s.heroStat}>
                  <Text style={s.heroStatVal}>{myResult.gf - myResult.ga}</Text>
                  <Text style={s.heroStatLabel}>РАЗНИЦА</Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* Таблица */}
        <Text style={s.sectionTitle}>ИТОГОВАЯ ТАБЛИЦА</Text>
        {results?.standings?.map((item) => {
          const isMe = Number(item.club_id) === Number(myClubId || club?.id);
          const z = getZone(item.position, league || 'epl');
          return (
            <View key={item.club_id} style={[s.row, isMe && s.rowMe]}>
              <View style={[s.zoneBar, { backgroundColor: z?.color || 'transparent' }]} />
              <Text style={[s.pos, isMe && { color: '#00d4ff' }]}>{item.position}</Text>
              <ClubBadge club={{ id: String(item.club_id), primary: '#333', secondary: '#fff', name: item.club_name }} size={22} />
              <Text style={[s.clubName, isMe && { color: '#00d4ff' }]} numberOfLines={1}>{item.club_name}</Text>
              <Text style={s.played}>{item.played}</Text>
              <Text style={[s.pts, isMe && { color: '#ffd700' }]}>{item.points}</Text>
            </View>
          );
        })}

        <TouchableOpacity style={[s.btn, { borderColor: zone?.color || '#00d4ff' }]} onPress={() => navigation.replace('Main')}>
          <Text style={[s.btnText, { color: zone?.color || '#00d4ff' }]}>СЛЕДУЮЩИЙ СЕЗОН →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#0a0a0f' },
  confetti:     { position: 'absolute', width: 10, height: 10, borderRadius: 2, zIndex: 999 },
  inner:        { padding: 20, paddingTop: 60, paddingBottom: 40, gap: 10 },
  heroCard:     { backgroundColor: '#12121a', borderRadius: 20, padding: 24, alignItems: 'center', gap: 14, borderWidth: 2, marginBottom: 8 },
  heroTitle:    { fontSize: 22, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  heroRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroClub:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  heroLeague:   { fontSize: 11, color: '#8888aa', marginTop: 2 },
  heroPos:      { fontSize: 36, fontWeight: '900', color: '#fff' },
  heroStats:    { flexDirection: 'row', gap: 20 },
  heroStat:     { alignItems: 'center' },
  heroStatVal:  { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroStatLabel:{ fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  sectionTitle: { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginTop: 8 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12121a', borderRadius: 10, padding: 10, gap: 8 },
  rowMe:        { backgroundColor: '#00d4ff15', borderWidth: 1, borderColor: '#00d4ff30' },
  zoneBar:      { width: 3, height: 22, borderRadius: 2 },
  pos:          { width: 22, fontSize: 11, color: '#8888aa', fontWeight: '700', textAlign: 'center' },
  clubName:     { flex: 1, fontSize: 12, color: '#fff', fontWeight: '600' },
  played:       { fontSize: 11, color: '#8888aa', width: 22, textAlign: 'center' },
  pts:          { fontSize: 14, color: '#00d4ff', fontWeight: '900', width: 28, textAlign: 'right' },
  btn:          { marginTop: 16, borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 2 },
  btnText:      { fontWeight: '900', fontSize: 15, letterSpacing: 2 },
});
