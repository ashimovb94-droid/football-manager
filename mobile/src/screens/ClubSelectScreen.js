import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';
import { C, FX } from '../design/theme';

export default function ClubSelectScreen() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(null);
  const [filter, setFilter] = useState('available');

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/clubs');
      setClubs(data);
    } catch (err) {
      if (err.response?.status !== 401) {
        Alert.alert('Ошибка', err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClaim = (club) => {
    Alert.alert(
      `Выбрать ${club.name}?`,
      `Бюджет: €${(Number(club.budget) / 1_000_000).toFixed(0)}M\nРейтинг: ${club.reputation}\nЦель: ${club.seasonGoal}\n\nЭто решение нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выбрать',
          onPress: async () => {
            setClaiming(club.id);
            try {
              await api.post(`/clubs/${club.id}/claim`);
              const { data: me } = await api.get('/auth/me');
              await setUser({
                id: me.id, username: me.username,
                manager: {
                  id: me.manager.id, name: me.manager.name,
                  reputation: me.manager.reputation, clubId: me.manager.clubId,
                },
              });
            } catch (err) {
              Alert.alert('Не получилось', err.response?.data?.error || err.message);
              load();
            } finally { setClaiming(null); }
          },
        },
      ],
    );
  };

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  const visible = filter === 'available' ? clubs.filter(c => c.canSelect) : clubs;

  return (
    <View style={FX.bg}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>ВЫБОР КЛУБА</Text>
          <Text style={s.sub}>
            Репутация {user?.manager?.reputation ?? '—'} · Доступно {clubs.filter(c => c.canSelect).length}/{clubs.length}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={s.exitBtn}>
          <Ionicons name="log-out-outline" size={18} color={C.muted} />
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {[['available', 'ДОСТУПНЫЕ'], ['all', 'ВСЕ']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, filter === key && s.tabActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.tabText, filter === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />
        }
        ListEmptyComponent={
          <Text style={s.empty}>
            {filter === 'available' ? 'Нет доступных клубов по твоей репутации' : 'Клубов нет'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.card, !item.canSelect && s.cardDisabled]}
            onPress={() => item.canSelect
              ? handleClaim(item)
              : Alert.alert(item.name, item.reason || 'Недоступно')}
            disabled={claiming !== null}
            activeOpacity={0.7}
          >
            <View style={[s.colorBar, { backgroundColor: item.primaryColor || C.accent }]} />
            <View style={s.cardBody}>
              <ClubBadge club={item} size={50} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                <View style={s.metaRow}>
                  <View style={s.metaItem}>
                    <Ionicons name="wallet-outline" size={11} color={C.gold} />
                    <Text style={s.metaText}>€{(Number(item.budget) / 1_000_000).toFixed(0)}M</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Ionicons name="star" size={11} color={C.accent} />
                    <Text style={s.metaText}>{item.reputation}</Text>
                  </View>
                </View>
                <Text style={s.exp}>{item.seasonGoal}</Text>
                {item.isTaken && <Text style={s.taken}>Занят: {item.takenBy}</Text>}
                {!item.canSelect && !item.isTaken && (
                  <Text style={s.locked}>
                    <Ionicons name="lock-closed" size={10} color={C.subtle} /> {item.reason}
                  </Text>
                )}
              </View>
              {claiming === item.id && <ActivityIndicator color={C.accent} />}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', padding: 16, paddingTop: 12, alignItems: 'center' },
  headerTitle: { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  sub: { color: C.muted, fontSize: 11, marginTop: 4 },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.accent },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tabTextActive: { color: C.accent },

  card: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: 12,
    marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  cardDisabled: { opacity: 0.45 },
  colorBar: { width: 4 },
  cardBody: { flex: 1, flexDirection: 'row', padding: 12, alignItems: 'center' },
  name: { color: C.text, fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: C.text, fontSize: 11, fontWeight: '600' },
  exp: { color: C.muted, fontSize: 11, marginTop: 6 },
  taken: { color: C.red, fontSize: 10, marginTop: 4 },
  locked: { color: C.subtle, fontSize: 10, marginTop: 4 },
  empty: { color: C.subtle, textAlign: 'center', padding: 30 },
});
