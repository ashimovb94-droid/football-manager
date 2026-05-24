import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';

const STADIUM = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80';

const C = {
  bg:     '#0d1117',
  card:   'rgba(22, 30, 43, 0.85)',
  border: 'rgba(255,255,255,0.06)',
  accent: '#4fc3f7',
  green:  '#2ecc71',
  gold:   '#f1c40f',
  red:    '#e74c3c',
  muted:  '#7a8a9e',
  subtle: '#3a4558',
};

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

const pStyles = StyleSheet.create({
  pitch: {
    flex: 1, width: '100%',
    aspectRatio: 0.75,
    backgroundColor: 'rgba(25, 75, 40, 0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    paddingVertical: 10,
  },
  centerCircle: {
    position: 'absolute', alignSelf: 'center', top: '38%',
    width: '32%', aspectRatio: 1, borderRadius: 999,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  midLine: {
    position: 'absolute', left: 0, right: 0, top: '50%',
    height: 1.5, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  linesWrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#fff',
  },
});

export default function HomeScreen({ navigation }) {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [data, setData] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [nextRoundAt, setNextRoundAt] = useState(null);
  const [tactic, setTactic] = useState(null);
  const [clubsMap, setClubsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const countdown = useCountdown(nextRoundAt);

  const load = useCallback(async () => {
    try {
      const { data: me } = await api.get('/auth/me');
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
          const mine = fixtures.find(f =>
            f.home.id === me.manager.clubId || f.away.id === me.manager.clubId
          );
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

  // Подгружаем заново при возвращении на экран — чтобы свежая тактика подхватилась
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  const club    = data?.manager?.club;
  const manager = data?.manager;
  const formation = tactic?.formation || '4-3-3';

  return (
    <ImageBackground source={{ uri: STADIUM }} style={s.bg} imageStyle={{ opacity: 0.35 }}>
      <View style={s.dark} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ХЕДЕР */}
        <View style={s.header}>
          <TouchableOpacity onPress={logout} style={{ paddingRight: 8 }}>
            <Ionicons name="chevron-back" size={24} color={C.muted} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>MANAGER</Text>
            <Text style={s.headerStats}>
              РЕПУТАЦИЯ: {manager?.reputation ?? 0} | БЮДЖЕТ: €{(Number(club?.budget ?? 0) / 1_000_000).toFixed(0)}M
            </Text>
          </View>
          <Ionicons name="cloud-outline" size={20} color={C.muted} />
        </View>

        {/* ПОЧТА */}
        <TouchableOpacity style={s.mailCard} activeOpacity={0.7}>
          <View style={{ flex: 1 }}>
            <Text style={s.mailLabel}>ПОЧТА</Text>
            <Text style={s.mailText}>У вас 0 новых сообщений</Text>
          </View>
          <View style={s.mailIconBox}>
            <Ionicons name="mail" size={20} color="#111" />
          </View>
        </TouchableOpacity>

        {/* ОСНОВНОЙ БЛОК */}
        <View style={s.grid}>

          {/* Левая колонка — кнопки прижаты к низу */}
          <View style={s.sideCol}>
            <View style={{ flex: 1 }} />
            <MenuBtn icon="settings-outline" label="НАСТРОЙКИ" onPress={() => {}} />
            <MenuBtn icon="person-outline"   label="ТРЕНИРОВКИ" onPress={() => {}} />
            <MenuBtn icon="briefcase-outline" label="ОФИС" onPress={() => {}} />
            <MenuBtn icon="globe-outline"    label="ОНЛАЙН" onPress={() => {}} />
          </View>

          {/* Центральная колонка */}
          <View style={s.centerCol}>
            {/* Карточка матча */}
            <View style={s.matchCard}>
              <Text style={s.matchLabel}>СЛЕДУЮЩИЙ МАТЧ</Text>

              <View style={s.matchRow}>
                <ClubBadge club={nextMatch?.home || club} size={54} />
                <View style={s.matchCenter}>
                  <Text style={s.matchVs}>VS</Text>
                  <Text style={s.matchTime}>{countdown || '20:45'}</Text>
                </View>
                <ClubBadge club={nextMatch?.away || club} size={54} />
              </View>

              <Text style={s.stadiumName}>
                {((nextMatch?.home?.name || club?.name || 'ASTON VILLA') + ' АРЕНА').toUpperCase()}
              </Text>
              <Text style={s.roundText}>ТУР {nextMatch?.round || 1}</Text>
            </View>

            {/* Карточка поля — теперь это КНОПКА на тактику */}
            <TouchableOpacity
              style={s.pitchCard}
              onPress={() => navigation.navigate('Tactics')}
              activeOpacity={0.8}
            >
              <View style={s.pitchTopRow}>
                <Text style={s.pitchTitle}>МАТЧ СКОРО</Text>
                <Ionicons name="create-outline" size={16} color={C.accent} />
              </View>
              <Text style={s.pitchSub}>
                СХЕМА: {formation} | МОРАЛЬ: ВЫСОКАЯ
              </Text>
              <View style={s.pitchWrap}>
                <MiniPitch formation={formation} />
              </View>
              <Text style={s.pitchHint}>НАЖМИТЕ ДЛЯ ИЗМЕНЕНИЯ ТАКТИКИ</Text>
            </TouchableOpacity>
          </View>

          {/* Правая колонка — кнопки прижаты к низу */}
          <View style={s.sideCol}>
            <View style={{ flex: 1 }} />
            <MenuBtn icon="swap-horizontal-outline" label="ТРАНСФЕРЫ"    onPress={() => navigation.navigate('Transfers')} />
            <MenuBtn icon="trophy-outline"          label="КУБОК"         onPress={() => navigation.navigate('Cup')} />
            <MenuBtn icon="list-outline"            label="ТАБЛИЦА"       onPress={() => navigation.navigate('Standings')} />
            <MenuBtn icon="calendar-outline"        label="КАЛЕНДАРЬ"     onPress={() => navigation.navigate('Fixtures')} />
            <MenuBtn icon="people-outline"          label="МОЙ КЛУБ"      onPress={() => navigation.navigate('Squad')} />
          </View>

        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function MenuBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.menuBtn} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={28} color={C.muted} style={{ marginBottom: 6 }} />
      <Text style={s.menuBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bg:     { flex: 1, backgroundColor: C.bg },
  dark:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 14, 23, 0.75)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  headerStats: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 3 },

  mailCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 20,
    padding: 16, backgroundColor: C.card,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
  },
  mailLabel: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  mailText:  { color: C.muted, fontSize: 11, marginTop: 4 },
  mailIconBox: {
    width: 40, height: 28, borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  grid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },

  sideCol: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  centerCol: {
    flex: 1,
    marginHorizontal: 4,
  },

  matchCard: {
    backgroundColor: C.card, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 10,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', marginBottom: 12,
  },
  matchLabel: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  matchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 16 },
  matchCenter: { width: 70, alignItems: 'center' },
  matchVs:     { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  matchTime:   { color: C.accent, fontSize: 12, fontWeight: '700' },
  stadiumName: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  roundText:   { color: C.muted, fontSize: 10, fontWeight: '600', marginTop: 6 },

  pitchCard: {
    backgroundColor: C.card, borderRadius: 16,
    padding: 16,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
  },
  pitchTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pitchTitle: { color: C.green, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  pitchSub:   { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 6, marginBottom: 14 },
  pitchWrap:  { width: '100%', flex: 1 },
  pitchHint:  { color: C.accent, fontSize: 8, fontWeight: '700', letterSpacing: 1, marginTop: 10, opacity: 0.7 },

  menuBtn: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18, width: 70,
  },
  menuBtnLabel: {
    color: C.muted, fontSize: 8, fontWeight: '700',
    textAlign: 'center',
  },
});
