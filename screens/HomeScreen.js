import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, FlatList } from 'react-native';
import { loadManagerData, loadSession, saveManagerData } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';
import LeagueBadge from '../components/LeagueBadge';
import MiniField from '../components/MiniField';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_NEWS = [
  { id: 'n1', icon: 'newspaper-outline', title: 'Добро пожаловать!', text: 'Новый сезон начинается', detail: 'Удачи в новом сезоне!' },
  { id: 'n2', icon: 'cash-outline', title: 'Трансферное окно', text: 'Летнее окно открыто', detail: 'Усиль состав новыми игроками.' },
  { id: 'n3', icon: 'calendar-outline', title: 'Расписание', text: 'Матчи сезона готовы', detail: 'Проверь расписание в разделе Сезон.' },
  { id: 'n4', icon: 'barbell-outline', title: 'Тренировки', text: 'Подготовь команду', detail: 'Назначь тренировки в офисе менеджера.' },
];

export default function HomeScreen() {
  const [gameState, setGameState] = useState(null);
  const [tick, setTick] = useState(0);
  const [managerName, setManagerName] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [tactics, setTactics] = useState({ formation: '4-3-3', lineup: {} });
  const [news, setNews] = useState(DEFAULT_NEWS);
  const [newsIdx, setNewsIdx] = useState(0);
  const [showNews, setShowNews] = useState(false);
  const [expandedNews, setExpandedNews] = useState(null);
  const newsAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadTactics();
      // Обновляем каждые 60 секунд
      const interval = setInterval(() => {
        loadData();
        setTick(t => t + 1);
      }, 60000);
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(newsAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(newsAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setNewsIdx(i => (i + 1) % news.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [news]);

  const loadData = async () => {
    const { token } = await loadSession();
    const { managerName } = await loadManagerData();
    setManagerName(managerName);
    if (!token) return;

    const state = await api.getGameState(token);
    if (state && !state.error) {
      setGameState(state);
      // Проверяем незакрытые итоги
      try {
        const pending = await api.getPendingResults(token);
        if (pending && pending.position) {
          navigation.navigate('SeasonResult', {
            league: pending.league,
            myClubId: state.club?.id,
            pendingResults: pending,
          });
          return;
        }
      } catch(e) {}
      if (state.club) {
        await saveManagerData(state.club, managerName);
        const p = await api.getPlayers(state.club.id);
        setPlayerCount(p.length);
      }
      const serverNews = await api.getNews(token);
      if (serverNews?.length > 0) {
        const mapped = serverNews.map(n => ({
          id: `server_${n.id}`,
          icon: n.icon || 'newspaper-outline',
          title: n.title,
          text: n.text,
          detail: n.text,
        }));
        setNews([...mapped, ...DEFAULT_NEWS].slice(0, 8));
      }
    }
  };

  const loadTactics = async () => {
    const { token } = await loadSession();
    if (token) {
      const t = await api.loadTactics(token);
      if (t && !t.detail) setTactics({ formation: t.formation || '4-3-3', lineup: t.lineup || {} });
    }
  };

  const club = gameState?.club;
  const preseason = gameState?.preseason;
  const nextMatch = gameState?.next_match;
  const standing = gameState?.standing;
  const showPreseason = preseason?.started && !preseason?.season_started;
  const currentNews = news.length > 0 ? news[newsIdx % news.length] : DEFAULT_NEWS[0];

  const opponent = nextMatch ? (
    nextMatch.is_home
      ? { id: String(nextMatch.away_id), primary: nextMatch.away_primary, secondary: '#fff', name: nextMatch.away_name }
      : { id: String(nextMatch.home_id), primary: nextMatch.home_primary, secondary: '#fff', name: nextMatch.home_name }
  ) : null;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

        {/* Шапка */}
        <View style={s.clubHeader}>
          <ClubBadge club={club} size={60} />
          <View style={s.clubInfo}>
            <Text style={s.clubName}>{club?.name || '...'}</Text>
            <TouchableOpacity style={s.managerBadge} onPress={() => navigation.navigate('ManagerProfile')}>
              <Ionicons name="person-outline" size={14} color="#00d4ff" />
              <Text style={s.managerName}>{managerName || '...'}</Text>
              <Ionicons name="chevron-forward" size={14} color="#8888aa" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Статы */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>£{club?.budget?.toFixed(0) || 0}M</Text>
            <Text style={s.statLabel}>БЮДЖЕТ</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: '#ffd700' }]}>{gameState?.manager_rating || 50}</Text>
            <Text style={s.statLabel}>РЕЙТИНГ</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: '#00ff88' }]}>{playerCount}</Text>
            <Text style={s.statLabel}>ИГРОКОВ</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <LeagueBadge league={club?.league || 'championship'} size={18} />
            <Text style={s.statLabel}>ЛИГА</Text>
          </View>
        </View>



        {/* Предсезонка или матч */}
        {showPreseason ? (
          <TouchableOpacity style={s.preseasonBanner} onPress={() => navigation.navigate('Preseason')}>
            <Ionicons name="barbell-outline" size={32} color="#bb99ff" style={{ marginRight: 14 }} />
            <View style={s.preseasonInfo}>
              <Text style={s.preseasonTitle}>ПРЕДСЕЗОННАЯ ПОДГОТОВКА</Text>
              <Text style={s.preseasonSub}>
                {preseason.hours_until_season > 0
                  ? `До сезона: ${Math.floor(preseason.hours_until_season)}ч`
                  : '3 дня · 6 товарищеских матчей'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#7b2fff" />
          </TouchableOpacity>
        ) : nextMatch ? (
          <View style={s.matchCard}>
            <Text style={s.matchLabel}>СЛЕДУЮЩИЙ МАТЧ · {nextMatch.date?.slice(5)} · ТУР {nextMatch.round}</Text>
            <View style={s.matchRow}>
              <View style={s.matchTeam}>
                <ClubBadge club={{ id: String(nextMatch.home_id), primary: nextMatch.home_primary, secondary: '#fff', name: nextMatch.home_name }} size={44} />
                <Text style={s.matchTeamName} numberOfLines={1}>{nextMatch.home_name}</Text>
              </View>
              <View style={s.matchCenter}>
                <Text style={s.matchVs}>VS</Text>
                <Text style={s.matchComp}>{club?.league === 'epl' ? 'АПЛ' : 'ЧЕМПИОНШИП'}</Text>
              </View>
              <View style={s.matchTeam}>
                <ClubBadge club={{ id: String(nextMatch.away_id), primary: nextMatch.away_primary, secondary: '#fff', name: nextMatch.away_name }} size={44} />
                <Text style={s.matchTeamName} numberOfLines={1}>{nextMatch.away_name}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Мини поле */}
        <MiniField
          formation={tactics.formation}
          lineup={tactics.lineup}
          onPress={() => navigation.navigate('Tactics')}
        />

        {/* Новости */}
        <TouchableOpacity style={s.newsCard} onPress={() => setShowNews(true)} activeOpacity={0.8}>
          <Animated.View style={[s.newsInner, { opacity: newsAnim }]}>
            <Ionicons name={currentNews.icon} size={28} color="#00d4ff" />
            <View style={s.newsText}>
              <Text style={s.newsTitle}>{currentNews.title}</Text>
              <Text style={s.newsSub}>{currentNews.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8888aa" />
          </Animated.View>
          <View style={s.newsDots}>
            {news.map((_, i) => (
              <View key={i} style={[s.dot, newsIdx === i && s.dotActive]} />
            ))}
          </View>
        </TouchableOpacity>

        {/* Модалка новостей */}
        <Modal visible={showNews} transparent animationType="slide">
          <View style={s.overlay}>
            <View style={s.newsModal}>
              <View style={s.newsModalHeader}>
                <Text style={s.newsModalTitle}>📰 НОВОСТИ КЛУБА</Text>
                <TouchableOpacity onPress={() => { setShowNews(false); setExpandedNews(null); }}>
                  <Text style={s.newsModalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={news}
                keyExtractor={i => String(i.id)}
                contentContainerStyle={{ padding: 16, gap: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[s.newsItem, expandedNews === item.id && s.newsItemExpanded]}
                    onPress={() => setExpandedNews(expandedNews === item.id ? null : item.id)}
                  >
                    <View style={s.newsItemHeader}>
                      <Ionicons name={item.icon} size={24} color="#00d4ff" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.newsItemTitle}>{item.title}</Text>
                        <Text style={s.newsItemSub}>{item.text}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#8888aa" style={{ transform: [{ rotate: expandedNews === item.id ? '90deg' : '0deg' }] }} />
                    </View>
                    {expandedNews === item.id && (
                      <Text style={s.newsItemDetail}>{item.detail}</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#0a0a0f' },
  inner:           { padding: 20, paddingTop: 56, paddingBottom: 20, gap: 12 },
  clubHeader:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  clubInfo:        { flex: 1 },
  clubName:        { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  managerBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#12121a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6, borderWidth: 1, borderColor: '#ffffff15', alignSelf: 'flex-start' },
  managerName:     { fontSize: 12, color: '#00d4ff', fontWeight: '700' },
  statsRow:        { flexDirection: 'row', backgroundColor: '#12121a', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff10' },
  statBox:         { flex: 1, alignItems: 'center', gap: 4 },
  statVal:         { fontSize: 16, fontWeight: '900', color: '#00d4ff' },
  statLabel:       { fontSize: 8, color: '#8888aa', letterSpacing: 1 },
  statDivider:     { width: 1, height: 32, backgroundColor: '#ffffff15' },
  standingCard:    { backgroundColor: '#12121a', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#ffd70030' },
  standingPos:     { fontSize: 28, fontWeight: '900', color: '#ffd700', width: 50 },
  standingLabel:   { fontSize: 10, color: '#8888aa', letterSpacing: 2 },
  standingStats:   { fontSize: 12, color: '#fff', marginTop: 2 },
  preseasonBanner: { backgroundColor: '#7b2fff30', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#7b2fff' },
  preseasonInfo:   { flex: 1 },
  preseasonTitle:  { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  preseasonSub:    { fontSize: 11, color: '#bb99ff', marginTop: 3 },
  matchCard:       { backgroundColor: '#12121a', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ffffff10' },
  matchLabel:      { fontSize: 10, color: '#8888aa', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  matchRow:        { flexDirection: 'row', alignItems: 'center' },
  matchTeam:       { flex: 1, alignItems: 'center', gap: 6 },
  matchTeamName:   { fontSize: 10, fontWeight: '700', color: '#fff', textAlign: 'center' },
  matchCenter:     { alignItems: 'center', paddingHorizontal: 12 },
  matchVs:         { fontSize: 20, fontWeight: '900', color: '#00d4ff', letterSpacing: 2 },
  matchComp:       { fontSize: 9, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  newsCard:        { backgroundColor: '#12121a', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ffffff10' },
  newsInner:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  newsText:        { flex: 1 },
  newsTitle:       { fontSize: 13, fontWeight: '800', color: '#fff' },
  newsSub:         { fontSize: 11, color: '#8888aa', marginTop: 3 },
  newsDots:        { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot:             { width: 5, height: 5, borderRadius: 3, backgroundColor: '#333' },
  dotActive:       { backgroundColor: '#00d4ff', width: 14 },
  overlay:         { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  newsModal:       { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', borderWidth: 1, borderColor: '#ffffff15' },
  newsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  newsModalTitle:  { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  newsModalClose:  { fontSize: 18, color: '#8888aa' },
  newsItem:        { backgroundColor: '#0a0a0f', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ffffff10' },
  newsItemExpanded:{ borderColor: '#00d4ff30', backgroundColor: '#00d4ff08' },
  newsItemHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newsItemTitle:   { fontSize: 13, fontWeight: '800', color: '#fff' },
  newsItemSub:     { fontSize: 11, color: '#8888aa', marginTop: 2 },
  newsItemDetail:  { fontSize: 13, color: '#ccc', lineHeight: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#ffffff10' },
});
