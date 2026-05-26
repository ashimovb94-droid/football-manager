import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';

// Импортируем нашу новую дизайн-систему
import { C, FX } from '../design/theme';

const STADIUM = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80';

function useCountdown(target) {
  const [str, setStr] = useState('');
  useEffect(() => {
    if (!target) { setStr(''); return; }
    const tick = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) { setStr('00:00:00'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setStr(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [target]);
  return str;
}

function MiniPitch({ formation = '4-3-3' }) {
  const layouts = {
    '4-3-3':   [1, 4, 3, 3],
    '4-4-2':   [1, 4, 4, 2],
    '3-5-2':   [1, 3, 5, 2],
    '4-2-3-1': [1, 4, 2, 3, 1],
    '5-3-2':   [1, 5, 3, 2],
  };
  const lines = layouts[formation] || layouts['4-3-3'];
  const reversed = [...lines].reverse();
  
  return (
    <View style={pStyles.pitch}>
      <View style={pStyles.centerCircle} />
      <View style={pStyles.midLine} />
      <View style={pStyles.linesWrap}>
        {reversed.map((count, i) => (
          <View key={i} style={pStyles.line}>
            {Array(count).fill(0).map((_, j) => (
              <View key={j} style={pStyles.dot} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}


function FriendlyCard({ navigation }) {
  const [status, setStatus] = useState({ available: 0, played: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/my/friendly').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const playFriendly = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/my/friendly');
      setStatus(s => ({ ...s, available: s.available - 1, played: s.played + 1 }));
      // Нормализуем friendly под формат MatchScreen
      const friendlyMatch = {
        home: data.friendly.homeClub,
        away: data.friendly.awayClub,
        result: { home: data.friendly.homeGoals, away: data.friendly.awayGoals },
        events: data.sim?.events ?? [],
        round: 'Товарняк',
        competition: { name: 'Предсезонка' },
      };
      navigation.navigate('Match', { fixtureId: null, friendly: friendlyMatch, events: data.sim?.events ?? [] });
    } catch (e) {
      Alert.alert('Ошибка', e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[FX.card, { alignItems: 'center', paddingVertical: 20 }]}>
      <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 14, marginBottom: 4, letterSpacing: 1 }}>
        🏋️ ПРЕДСЕЗОНКА
      </Text>
      <Text style={{ color: C.subtext, fontSize: 12, marginBottom: 12 }}>
        Товарняки сегодня: {status.played}/{status.played + status.available}
      </Text>
      {status.available > 0 ? (
        <TouchableOpacity
          style={{ backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
          onPress={playFriendly}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
            {loading ? 'Идёт матч...' : '⚽ СЫГРАТЬ ТОВАРНЯК'}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={{ color: C.subtext, fontSize: 12 }}>Лимит на сегодня исчерпан</Text>
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [data, setData] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [seasonOver, setSeasonOver] = useState(false);
  const [phase, setPhase] = useState(null);
  const [daysLeft, setDaysLeft] = useState(null);
  const [nextRoundAt, setNextRoundAt] = useState(null);
  const [tactic, setTactic] = useState(null);
  const [clubsMap, setClubsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const countdown = useCountdown(nextRoundAt);

  const load = useCallback(async () => {
    try {
      const { data: me } = await api.get('/auth/me');
        const { data: ss } = await api.get('/season/state');
        setPhase(ss.phase);
        setDaysLeft(ss.daysLeft);
        setSeasonOver(ss.phase === 'SUMMER_WINDOW' || ss.phase === 'END_SEASON');
      setData(me);

      const { data: clubs } = await api.get('/clubs');
      const cm = Object.fromEntries(clubs.map(c => [c.id, c]));
      setClubsMap(cm);

      const { data: comps } = await api.get('/competitions');
      const apl = comps.find(c => c.type === 'LEAGUE' && c.tier === 1);
      
      if (apl && me.manager?.clubId) {
        const { data: cr } = await api.get(`/competitions/${apl.id}/current-round`);
        setNextRoundAt(cr.nextRoundAt);
        if (cr.nextRound) {
          const { data: fixtures } = await api.get(`/competitions/${apl.id}/fixtures?round=${cr.nextRound}`);
          const mine = fixtures.find(f => f.home.id === me.manager.clubId || f.away.id === me.manager.clubId);
          if (mine) {
            setNextMatch({
              ...mine,
              home: { ...mine.home, ...cm[mine.home.id] },
              away: { ...mine.away, ...cm[mine.away.id] },
              round: cr.nextRound,
            });
          }
        }
      }

      try {
        const { data: t } = await api.get('/my/tactic');
        setTactic(t);
      } catch {}
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Авто-обновление каждые 60 сек пока экран в фокусе
  useEffect(() => {
    let iv = null;
    const start = navigation.addListener('focus', () => {
      iv = setInterval(load, 15000);
    });
    const stop = navigation.addListener('blur', () => {
      if (iv) { clearInterval(iv); iv = null; }
    });
    return () => { start(); stop(); if (iv) clearInterval(iv); };
  }, [navigation, load]);

  if (loading) return (
    <View style={FX.center}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  const club    = data?.manager?.club;
  const manager = data?.manager;
  const formation = tactic?.formation || '4-3-3';

  return (
    <ImageBackground source={{ uri: STADIUM }} style={FX.bg} imageStyle={{ opacity: 0.25 }}>
      <View style={s.darkOverlay} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ХЕДЕР */}
        <View style={s.header}>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={C.red} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>MANAGER</Text>
            <Text style={s.headerStats}>
              РЕПУТАЦИЯ: {manager?.reputation ?? 0}  ·  БЮДЖЕТ: €{(Number(club?.budget ?? 0) / 1_000_000).toFixed(0)}M
            </Text>
          </View>
          <TouchableOpacity style={s.cloudBtn}>
            <Ionicons name="cloud-done-outline" size={22} color={C.muted} />
          </TouchableOpacity>
        </View>

        <View style={s.contentContainer}>
          {/* ПОЧТА */}
          <TouchableOpacity style={s.mailCard} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={s.mailLabel}>ПОЧТА</Text>
              <Text style={s.mailText}>У вас 0 новых сообщений</Text>
            </View>
            <View style={s.mailIconBox}>
              <Ionicons name="mail" size={20} color="#000" />
            </View>
          </TouchableOpacity>

          {/* КАРТОЧКА МАТЧА / КОНЕЦ СЕЗОНА */}
          {seasonOver ? (
            <TouchableOpacity
              style={[FX.card, { alignItems: 'center', paddingVertical: 28 }]}
              onPress={() => navigation.navigate('SeasonResults')}
              activeOpacity={0.8}
            >
              <Text style={[s.sectionBadge, { color: '#FFD700', fontSize: 16, marginBottom: 8 }]}>
                🏁 СЕЗОН ЗАВЕРШЁН
              </Text>
              <Text style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
                Нажмите для просмотра итогов
              </Text>
              {phase === 'SUMMER_WINDOW' && daysLeft != null && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 13, textAlign: 'center' }}>
                    ⏱ Предсезонка через {Math.floor(daysLeft)}д {Math.floor((daysLeft % 1) * 24)}ч
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : phase === 'PRESEASON' ? (
            <FriendlyCard navigation={navigation} />
          ) : (
            <View style={FX.card}>
              <Text style={s.sectionBadge}>СЛЕДУЮЩИЙ МАТЧ</Text>
              <View style={s.matchRow}>
                <ClubBadge club={nextMatch?.home || club} size={60} />
                <View style={s.matchCenter}>
                  <Text style={s.matchVs}>VS</Text>
                  <Text style={s.matchTime}>{countdown || '20:45'}</Text>
                </View>
                <ClubBadge club={nextMatch?.away || club} size={60} />
              </View>
              <Text style={s.stadiumName}>
                {((nextMatch?.home?.name || club?.name || 'ASTON VILLA') + ' АРЕНА').toUpperCase()}
              </Text>
              <Text style={s.roundText}>ТУР {nextMatch?.round || 1}</Text>
            </View>
          )}

          {/* ТАКТИКА */}
          <TouchableOpacity
            style={FX.card}
            onPress={() => navigation.navigate('Tactics')}
            activeOpacity={0.8}
          >
            <View style={s.pitchTopRow}>
              <Text style={s.sectionBadge}>ТАКТИКА И СОСТАВ</Text>
              <Ionicons name="create-outline" size={18} color={C.accent} />
            </View>
            <Text style={s.pitchSub}>
              СХЕМА: {formation}  ·  МОРАЛЬ: ВЫСОКАЯ
            </Text>
            <MiniPitch formation={formation} />
            <Text style={s.pitchHint}>НАЖМИТЕ ДЛЯ ИЗМЕНЕНИЯ</Text>
          </TouchableOpacity>
          {/* УПРАВЛЕНИЕ КЛУБОМ */}
            <Text style={s.gridTitle}>УПРАВЛЕНИЕ КЛУБОМ</Text>
           <View style={s.actionGrid}>
            <ActionBtn icon="list" label="ТАБЛИЦА" onPress={() => navigation.navigate('Standings')} />
            <ActionBtn icon="trophy" label="КУБОК" onPress={() => navigation.navigate('Cup')} />
            <ActionBtn icon="briefcase" label="ОФИС" onPress={() => {}} />
            
            <ActionBtn icon="barbell" label="ТРЕНИРОВКИ" onPress={() => navigation.navigate('Training')} />
            <ActionBtn icon="globe" label="ОНЛАЙН" onPress={() => {}} />
            <ActionBtn icon="settings" label="НАСТРОЙКИ" onPress={() => {}} />
          </View>

        </View>
      </ScrollView>
    </ImageBackground>
  );
}

// Новый компонент кнопки для сетки
function ActionBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={s.actionIconWrap}>
        <Ionicons name={icon} size={24} color={C.text} />
      </View>
      <Text style={s.actionBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Стили мини-поля (оставил как было, только цвета подкрутил)
const pStyles = StyleSheet.create({
  pitch: {
    width: '100%', aspectRatio: 1.2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Зеленый из темы с прозрачностью
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8, overflow: 'hidden', position: 'relative',
    paddingVertical: 10,
  },
  centerCircle: {
    position: 'absolute', alignSelf: 'center', top: '32%',
    width: '35%', aspectRatio: 1, borderRadius: 999,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  midLine: {
    position: 'absolute', left: 0, right: 0, top: '50%',
    height: 1.5, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  linesWrap: { flex: 1, justifyContent: 'space-between', paddingVertical: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', elevation: 2 },
});

const s = StyleSheet.create({
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 17, 23, 0.85)' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 20,
  },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(231,76,60,0.1)', borderRadius: 8 },
  cloudBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  headerStats: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },

  contentContainer: { paddingHorizontal: 16 },

  mailCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.accentDim,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.borderActive,
    marginBottom: 16,
  },
  mailLabel: { color: C.accent, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  mailText:  { color: C.text, fontSize: 12, marginTop: 4, fontWeight: '600' },
  mailIconBox: {
    width: 44, height: 32, borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionBadge: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16, alignSelf: 'center' },
  
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 16 },
  matchCenter: { width: 80, alignItems: 'center' },
  matchVs: { color: C.muted, fontSize: 14, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  matchTime: { color: C.gold, fontSize: 18, fontWeight: '900' },
  stadiumName: { color: C.text, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  roundText: { color: C.muted, fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },

  pitchTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  pitchSub: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: -4, marginBottom: 16, alignSelf: 'flex-start' },
  pitchHint: { color: C.subtle, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 12, textAlign: 'center' },

  gridTitle: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 1, marginTop: 10, marginBottom: 16, paddingLeft: 4 },
    actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    // gap убрали к чертям, чтобы не ломал сетку
  },
  actionBtn: {
    width: '31%', // 3 колонки железобетонно (31 * 3 = 93%, остаток пойдет на отступы)
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12, // отступ снизу задаем тут
  },
  actionIconWrap: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  actionBtnLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

