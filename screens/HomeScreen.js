import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, FlatList } from 'react-native';
import { loadManagerData, loadSession } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';
import LeagueBadge from '../components/LeagueBadge';
import MiniField from '../components/MiniField';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_NEWS = [
  { id: 1, icon: 'newspaper-outline', title: 'Предсезонная подготовка', text: 'Команда готовится к новому сезону', detail: 'Тренерский штаб разработал программу предсезонной подготовки.' },
  { id: 2, icon: 'cash-outline', title: 'Трансферное окно открыто', text: 'Летнее окно открыто до 31 августа', detail: 'Летнее трансферное окно официально открыто.' },
  { id: 3, icon: 'calendar-outline', title: 'Первый матч сезона', text: 'Скоро стартует Чемпионшип', detail: 'Чемпионшип стартует 9 августа.' },
  { id: 4, icon: 'barbell-outline', title: 'Тренировочный лагерь', text: 'Команда проходит предсезонные сборы', detail: 'Регулярные тренировки повысят рейтинг команды.' },
];

export default function HomeScreen() {
  const [club, setClub] = useState(null);
  const [managerName, setManagerName] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [nextMatch, setNextMatch] = useState(null);
  const [preseasonStatus, setPreseasonStatus] = useState(null);
  const [tactics, setTactics] = useState({ formation: '4-3-3', lineup: {} });
  const [newsIdx, setNewsIdx] = useState(0);
  const [news, setNews] = useState(DEFAULT_NEWS);
  const [showNews, setShowNews] = useState(false);
  const [expandedNews, setExpandedNews] = useState(null);
  const newsAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();

  useEffect(() => {
    const load = async () => {
      const { token } = await loadSession();
      const { club, managerName } = await loadManagerData();
      setManagerName(managerName);
      if (club) {
        api.getPlayers(club.id).then(p => setPlayerCount(p.length));
        const lg = club.league || 'championship';
        const roundData = await api.getCurrentRound(lg);
        const matches = await api.getMatches(lg, roundData.round || 1);
        const myMatch = matches.find(m =>
          Number(m.home_id) === Number(club.id) || Number(m.away_id) === Number(club.id)
        );
        if (myMatch) {
          const isHome = Number(myMatch.home_id) === Number(club.id);
          setNextMatch({ ...myMatch, isHome });
        }
      }
      if (token) {
        const user = await api.getMe(token);
        if (user && user.club) {
          setClub(user.club);
          await import('../utils/storage').then(m => m.saveManagerData(user.club, managerName));
        } else setClub(club);
        const ps = await api.getPreseasonStatus();
        setPreseasonStatus(ps);
        if (token) {
          try {
            const serverNews = await api.getNews(token);
            if (serverNews && serverNews.length > 0) {
              const mapped = serverNews.map(n => ({
                id: `server_${n.id}`,
                icon: n.icon || 'newspaper-outline',
                title: n.title,
                text: n.text,
                detail: n.text,
              }));
              setNews([...mapped, ...DEFAULT_NEWS].slice(0, 8));
            }
          } catch(e) {}
        }
        const t = await api.loadTactics(token);
        if (t && !t.detail) setTactics({ formation: t.formation || '4-3-3', lineup: t.lineup || {} });
      } else setClub(club);
    };
    load();
  }, []);

  // Обновляем тактику при возврате на экран
  useFocusEffect(
    useCallback(() => {
      loadSession().then(({ token }) => {
        if (token) {
          api.loadTactics(token).then(t => {
            if (t && !t.detail) {
              setTactics({ formation: t.formation || '4-3-3', lineup: t.lineup || {} });
            }
          });
        }
      });
    }, [])
  );

  // Автосмена новостей
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(newsAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(newsAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setNewsIdx(i => (i + 1) % news.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const opponent = nextMatch ? (
    nextMatch.isHome
      ? { id: String(nextMatch.away_id), primary: nextMatch.away_primary || '#333', secondary: '#fff', name: nextMatch.away_name }
      : { id: String(nextMatch.home_id), primary: nextMatch.home_primary || '#333', secondary: '#fff', name: nextMatch.home_name }
  ) : null;

  const showPreseason = preseasonStatus?.started && !preseasonStatus?.season_started;
  const currentNews = news.length > 0 ? news[newsIdx % news.length] : DEFAULT_NEWS[0];

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

        {/* Шапка клуба */}
        <View style={s.clubHeader}>
          <ClubBadge club={club} size={60} />
          <View style={s.clubInfo}>
            <Text style={s.clubName}>{club?.name || '...'}</Text>
            <TouchableOpacity
              style={s.managerBadge}
              onPress={() => navigation.navigate('ManagerProfile')}
            >
              <Ionicons name='person-outline' size={14} color='#00d4ff' />
              <Text style={s.managerName}>{managerName || '...'}</Text>
              <Text style={s.managerArrow}>›</Text>
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
            <Text style={[s.statVal, { color: '#ffd700' }]}>{club?.rating || 50}</Text>
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
            <Ionicons name='barbell-outline' size={32} color='#bb99ff' style={{ marginRight: 14 }} />
            <View style={s.preseasonInfo}>
              <Text style={s.preseasonTitle}>ПРЕДСЕЗОННАЯ ПОДГОТОВКА</Text>
              <Text style={s.preseasonSub}>3 дня · 6 товарищеских матчей</Text>
            </View>
            <Text style={s.preseasonArrow}>›</Text>
          </TouchableOpacity>
        ) : nextMatch ? (
          <View style={s.matchCard}>
            <Text style={s.matchLabel}>СЛЕДУЮЩИЙ МАТЧ · {nextMatch.date?.slice(5)}</Text>
            <View style={s.matchRow}>
              <View style={s.matchTeam}>
                <ClubBadge club={club} size={44} />
                <Text style={s.matchTeamName} numberOfLines={1}>{club?.name}</Text>
              </View>
              <View style={s.matchCenter}>
                <Text style={s.matchVs}>VS</Text>
                <Text style={s.matchComp}>{club?.league === 'epl' ? 'АПЛ' : 'ЧЕМПИОНШИП'}</Text>
              </View>
              <View style={s.matchTeam}>
                <ClubBadge club={opponent || {}} size={44} />
                <Text style={s.matchTeamName} numberOfLines={1}>{opponent?.name}</Text>
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

        {/* Новости — динамические */}
        <TouchableOpacity style={s.newsCard} onPress={() => setShowNews(true)} activeOpacity={0.8}>
          <Animated.View style={[s.newsInner, { opacity: newsAnim }]}>
            <Ionicons name={currentNews.icon} size={28} color='#00d4ff' />
            <View style={s.newsText}>
              <Text style={s.newsTitle}>{currentNews.title}</Text>
              <Text style={s.newsSub}>{currentNews.text}</Text>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#8888aa' />
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
                      <Ionicons name={item.icon} size={24} color='#00d4ff' />
                      <View style={{ flex: 1 }}>
                        <Text style={s.newsItemTitle}>{item.title}</Text>
                        <Text style={s.newsItemSub}>{item.text}</Text>
                      </View>
                      <Text style={[s.newsItemArrow, expandedNews === item.id && s.newsItemArrowOpen]}>›</Text>
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
  managerIcon:     { fontSize: 12 },
  managerName:     { fontSize: 12, color: '#00d4ff', fontWeight: '700' },
  managerArrow:    { fontSize: 14, color: '#8888aa' },
  statsRow:        { flexDirection: 'row', backgroundColor: '#12121a', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff10' },
  statBox:         { flex: 1, alignItems: 'center', gap: 4 },
  statVal:         { fontSize: 16, fontWeight: '900', color: '#00d4ff' },
  statLabel:       { fontSize: 8, color: '#8888aa', letterSpacing: 1 },
  statDivider:     { width: 1, height: 32, backgroundColor: '#ffffff15' },
  preseasonBanner: { backgroundColor: '#7b2fff30', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#7b2fff' },
  preseasonIcon:   { fontSize: 32, marginRight: 14 },
  preseasonInfo:   { flex: 1 },
  preseasonTitle:  { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  preseasonSub:    { fontSize: 11, color: '#bb99ff', marginTop: 3 },
  preseasonArrow:  { fontSize: 26, color: '#7b2fff', fontWeight: '900' },
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
  newsIcon:        { fontSize: 28 },
  newsText:        { flex: 1 },
  newsTitle:       { fontSize: 13, fontWeight: '800', color: '#fff' },
  newsSub:         { fontSize: 11, color: '#8888aa', marginTop: 3 },
  newsDots:        { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot:             { width: 5, height: 5, borderRadius: 3, backgroundColor: '#333' },
  dotActive:          { backgroundColor: '#00d4ff', width: 14 },
  newsMore:           { fontSize: 20, color: '#8888aa' },
  overlay:            { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  newsModal:          { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', borderWidth: 1, borderColor: '#ffffff15' },
  newsModalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  newsModalTitle:     { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  newsModalClose:     { fontSize: 18, color: '#8888aa' },
  newsItem:           { backgroundColor: '#0a0a0f', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ffffff10' },
  newsItemExpanded:   { borderColor: '#00d4ff30', backgroundColor: '#00d4ff08' },
  newsItemHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  newsItemIcon:       { fontSize: 24 },
  newsItemTitle:      { fontSize: 13, fontWeight: '800', color: '#fff' },
  newsItemSub:        { fontSize: 11, color: '#8888aa', marginTop: 2 },
  newsItemArrow:      { fontSize: 20, color: '#8888aa', transform: [{ rotate: '0deg' }] },
  newsItemArrowOpen:  { transform: [{ rotate: '90deg' }] },
  newsItemDetail:     { fontSize: 13, color: '#ccc', lineHeight: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#ffffff10' },
});
