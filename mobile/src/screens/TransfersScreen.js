import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';
import { C, FX, POS_COLOR, POSITION_GROUP } from '../design/theme';

const POSITIONS = ['ALL','GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST'];

const fmtM = (s) => {
  const n = Number(s);
  if (n >= 1_000_000) return `€${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n/1_000).toFixed(0)}K`;
  return `€${n}`;
};

const getInitials = (f, l) =>
  `${(f||'').charAt(0)}${(l||'').charAt(0)}`.toUpperCase();

const POS_GROUP_OF = (pos) => POSITION_GROUP[pos] || 'MID';

export default function TransfersScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('market');  // market | free | offers
  const [windowState, setWindowState] = useState({ open: false, phase: 'UNKNOWN' });
  const [posFilter, setPosFilter] = useState('ALL');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWindow = useCallback(async () => {
    try {
      const { data } = await api.get('/transfers/window');
      setWindowState(data);
    } catch {}
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const posParam = posFilter !== 'ALL' ? `?position=${posFilter}` : '';
      if (tab === 'market') {
        const { data } = await api.get(`/transfers/market${posParam}`);
        setItems(data);
      } else if (tab === 'free') {
        const { data } = await api.get(`/transfers/free-agents${posParam}`);
        setItems(data);
      } else if (tab === 'offers') {
        const { data } = await api.get('/transfers/my-offers');
        setItems(data);
      }
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, posFilter]);

  useEffect(() => { loadWindow(); }, [loadWindow]);
  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { loadWindow(); loadList(); });
    return unsub;
  }, [navigation, loadWindow, loadList]);

  return (
    <View style={FX.bg}>
      {/* Статус окна */}
      <View style={[s.windowBar, windowState.open ? s.windowOpen : s.windowClosed]}>
        <Ionicons
          name={windowState.open ? "checkmark-circle" : "lock-closed"}
          size={16}
          color={windowState.open ? C.green : C.red}
        />
        <Text style={[s.windowText, { color: windowState.open ? C.green : C.red }]}>
          {windowState.open
            ? `${windowState.type === 'SUMMER' ? 'ЛЕТНЕЕ' : 'ЗИМНЕЕ'} ОКНО ОТКРЫТО`
            : 'ТРАНСФЕРНОЕ ОКНО ЗАКРЫТО'}
        </Text>
      </View>

      {/* Вкладки */}
      <View style={s.tabsRow}>
        <Tab label="РЫНОК" active={tab==='market'} onPress={() => setTab('market')} />
        <Tab label="СВОБОДНЫЕ" active={tab==='free'} onPress={() => setTab('free')} />
        <Tab label="ОФЕРТЫ" active={tab==='offers'} onPress={() => setTab('offers')} />
        <Tab label="СКАУТЫ" active={false} onPress={() => navigation.navigate('Scouts')} />
      </View>

      {/* Фильтр позиций (только для market/free) */}
      {tab !== 'offers' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6, paddingVertical: 8, alignItems: 'center' }}
          style={{ maxHeight: 44 }}
        >
          {POSITIONS.map(p => (
            <TouchableOpacity
              key={p}
              style={[s.posChip, posFilter === p && s.posChipActive]}
              onPress={() => setPosFilter(p)}
            >
              <Text style={[s.posChipText, posFilter === p && { color: C.bg }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={[FX.center, { paddingTop: 40 }]}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadList(); }} tintColor={C.accent} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={s.empty}>
              {tab === 'offers' ? 'У вас нет активных оферт' : 'Никого не найдено'}
            </Text>
          }
          renderItem={({ item }) => {
            if (tab === 'offers') return renderOfferCard(item, navigation);
            return renderPlayerCard(item, tab, navigation, windowState.open);
          }}
        />
      )}
    </View>
  );
}

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity style={s.tab} onPress={onPress}>
      <Text style={[s.tabText, active && s.tabActive]}>{label}</Text>
      {active && <View style={s.tabUnderline} />}
    </TouchableOpacity>
  );
}

function renderPlayerCard(p, tab, navigation, windowOpen) {
  const group = POS_GROUP_OF(p.position);
  return (
    <TouchableOpacity
      style={s.playerCard}
      onPress={() => navigation.navigate('PlayerOffer', { playerId: p.id, mode: tab === 'free' ? 'free' : 'market' })}
      activeOpacity={0.7}
      disabled={!windowOpen}
    >
      <View style={[s.avatar, { borderColor: POS_COLOR[group] }]}>
        <Text style={s.avatarText}>{getInitials(p.firstName, p.lastName)}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.playerName}>{p.firstName} {p.lastName}</Text>
        <View style={s.metaRow}>
          <Text style={[s.posBadge, { color: POS_COLOR[group], borderColor: POS_COLOR[group] }]}>
            {p.position}
          </Text>
          <Text style={s.metaText}>{p.age} лет · {p.nationality}</Text>
        </View>
        {p.club && (
          <View style={s.clubRow}>
            <ClubBadge club={p.club} size={16} />
            <Text style={s.clubText} numberOfLines={1}>{p.club.name}</Text>
          </View>
        )}
        {tab === 'free' && (
          <View style={s.clubRow}>
            <Ionicons name="person-remove-outline" size={12} color={C.muted} />
            <Text style={s.clubText}>Свободный агент</Text>
          </View>
        )}
      </View>
      <View style={s.rightCol}>
        <Text style={s.ovrText}>{p.overall}</Text>
        <Text style={s.priceText}>{fmtM(p.marketValue)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function renderOfferCard(o, navigation) {
  if (!o?.player) return null;
  const statusColors = {
    PENDING: C.muted,
    COUNTER_OFFERED: C.gold,
    CLUB_ACCEPTED: C.accent,
    PLAYER_NEGOTIATING: C.accent,
    PLAYER_ACCEPTED: C.green,
    REJECTED_BY_CLUB: C.red,
    REJECTED_BY_PLAYER: C.red,
    CANCELLED: C.subtle,
    EXPIRED: C.subtle,
  };
  const statusLabel = {
    PENDING: 'Отправлено',
    COUNTER_OFFERED: 'Контр-оферта',
    CLUB_ACCEPTED: 'Клуб согласен → переговоры с игроком',
    PLAYER_NEGOTIATING: 'Переговоры с игроком',
    PLAYER_ACCEPTED: '✓ Подписан!',
    REJECTED_BY_CLUB: 'Клуб отказал',
    REJECTED_BY_PLAYER: 'Игрок отказал',
    CANCELLED: 'Отозвано',
    EXPIRED: 'Истекло',
  };
  const color = statusColors[o.status] || C.muted;

  return (
    <TouchableOpacity
      style={[s.offerCard, { borderLeftColor: color }]}
      onPress={() => (o.status === 'CLUB_ACCEPTED' || o.status === 'COUNTER_OFFERED') && navigation.navigate('OfferDetail', { offerId: o.id })}
      activeOpacity={0.7}
    >
      <View style={s.offerTop}>
        <Text style={s.offerPlayer}>{o.player.firstName} {o.player.lastName}</Text>
        <Text style={s.offerAmount}>{fmtM(o.amount)}</Text>
      </View>
      <View style={s.offerMeta}>
        <View style={s.clubRow}>
          {o.toClub && <ClubBadge club={o.toClub} size={14} />}
          <Text style={s.clubText} numberOfLines={1}>{o.toClub?.name || '—'}</Text>
        </View>
        <Text style={[s.offerStatus, { color }]} numberOfLines={2}>{statusLabel[o.status]}</Text>
      </View>
      {(o.status === 'CLUB_ACCEPTED' || o.status === 'COUNTER_OFFERED') && (
        <View style={s.offerCTA}>
          <Text style={s.offerCTAText}>→ {o.status === 'CLUB_ACCEPTED' ? 'Завершить сделку' : 'Посмотреть условия'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  windowBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 12, gap: 6,
    marginHorizontal: 12, marginTop: 8, borderRadius: 8,
    borderWidth: 1,
  },
  windowOpen:   { backgroundColor: 'rgba(46,204,113,0.1)', borderColor: 'rgba(46,204,113,0.3)' },
  windowClosed: { backgroundColor: 'rgba(231,76,60,0.1)', borderColor: 'rgba(231,76,60,0.3)' },
  windowText:   { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tabActive: { color: C.accent },
  tabUnderline: { height: 2, backgroundColor: C.accent, width: '60%', marginTop: 6 },

  posChip: {
    paddingHorizontal: 14,
    height: 28,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  posChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  posChipText: { color: C.muted, fontSize: 11, fontWeight: '700' },

  playerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, padding: 12, marginBottom: 8,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  playerName: { color: C.text, fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  posBadge: {
    fontSize: 10, fontWeight: '800',
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4, borderWidth: 1,
  },
  metaText: { color: C.muted, fontSize: 11 },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  clubText: { color: C.muted, fontSize: 11, flex: 1 },

  rightCol: { alignItems: 'flex-end', marginLeft: 8 },
  ovrText: { color: C.gold, fontSize: 20, fontWeight: '900' },
  priceText: { color: C.accent, fontSize: 12, fontWeight: '700', marginTop: 4 },

  // Оферты
  offerCard: {
    backgroundColor: C.card, padding: 12, marginBottom: 8,
    borderRadius: 10, borderLeftWidth: 4,
    borderTopWidth: 1, borderBottomWidth: 1, borderRightWidth: 1,
    borderTopColor: C.border, borderBottomColor: C.border, borderRightColor: C.border,
  },
  offerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerPlayer: { color: C.text, fontSize: 14, fontWeight: '700' },
  offerAmount: { color: C.gold, fontSize: 14, fontWeight: '800' },
  offerMeta: {
    marginTop: 8, gap: 4,
  },
  offerStatus: { fontSize: 11, fontWeight: '700' },
  offerCTA: {
    marginTop: 10, padding: 8,
    backgroundColor: 'rgba(79,195,247,0.15)',
    borderRadius: 8, alignItems: 'center',
  },
  offerCTAText: { color: C.accent, fontSize: 12, fontWeight: '800' },

  empty: { color: C.subtle, textAlign: 'center', padding: 30 },
});
