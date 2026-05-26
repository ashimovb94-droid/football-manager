import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, Image, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, TextInput,
  ActivityIndicator, RefreshControl, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { C, FX, POSITION_GROUP, POS_COLOR, overall, fitnessColor } from '../design/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GROUP_TITLE = {
  GK:  'ВРАТАРИ',
  DEF: 'ЗАЩИТНИКИ',
  MID: 'ПОЛУЗАЩИТНИКИ',
  FWD: 'НАПАДАЮЩИЕ',
};

const getInitials = (first, last) => {
  return `${(first||'').charAt(0)}${(last||'').charAt(0)}`.toUpperCase();
};

export default function SquadScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [club, setClub] = useState(null);
  const [expanded, setExpanded] = useState({ GK: true, DEF: true, MID: true, FWD: true });
  const [actionFor, setActionFor] = useState(null);
  const [listPrice, setListPrice] = useState('');
  const [listType, setListType] = useState('SALE');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/my/squad');
      setPlayers(data.players);
      const { data: me } = await api.get('/auth/me');
      setClub(me.manager?.club);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = (group) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  const groups = { GK: [], DEF: [], MID: [], FWD: [] };
  players.forEach(p => {
    const g = POSITION_GROUP[p.position] || 'MID';
    groups[g].push(p);
  });
  Object.keys(groups).forEach(k => groups[k].sort((a, b) => overall(b) - overall(a)));

  const injuredCount = players.filter(p => p.injured).length;

  return (
    <View style={FX.bg}>
      {/* ХЕДЕР */}
      <View style={s.header}>
        <Text style={s.headerTitle}>МОЙ СОСТАВ</Text>
        <View style={s.headerBadges}>
          {injuredCount > 0 && (
            <View style={[s.badge, { borderColor: C.red, backgroundColor: C.redDim }]}>
              <Ionicons name="medkit" size={11} color={C.red} />
              <Text style={[s.badgeText, { color: C.red }]}>{injuredCount}</Text>
            </View>
          )}
          <View style={[s.badge, { borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Ionicons name="people" size={11} color={C.muted} />
            <Text style={[s.badgeText, { color: C.muted }]}>{players.length}/30</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={Object.entries(groups)}
        keyExtractor={([k]) => k}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        renderItem={({ item: [group, list] }) => (
          <View style={s.section}>
            <TouchableOpacity style={s.sectionHeader} onPress={() => toggle(group)} activeOpacity={0.7}>
              <Text style={s.sectionTitle}>{GROUP_TITLE[group]} ({list.length})</Text>
              <Ionicons
                name={expanded[group] ? 'chevron-up' : 'chevron-down'}
                size={16} color={C.accent}
              />
            </TouchableOpacity>
            {expanded[group] && list.map(p => (
              <View key={p.id} style={[s.row, p.injured && s.rowInjured]}>
                <View style={[s.avatar, { borderColor: POS_COLOR[group] }]}>
                  {p.photoUrl
                    ? <Image source={{ uri: p.photoUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    : <Text style={s.avatarText}>{getInitials(p.firstName, p.lastName)}</Text>
                  }
                </View>
                <View style={s.info}>
                  <View style={s.nameRow}>
                    <Text style={s.name} numberOfLines={1}>
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={s.ovr}>{overall(p)}</Text>
                  </View>
                  <Text style={s.sub}>
                    {p.position} · {p.age} лет · {p.nationality}
                  </Text>
                  <View style={s.fitRow}>
                    <Text style={s.fitLabel}>FIT</Text>
                    <View style={s.fitBar}>
                      <View style={[s.fitFill, {
                        width: `${p.fitness}%`,
                        backgroundColor: fitnessColor(p.fitness),
                      }]} />
                    </View>
                    <Text style={[s.fitNum, { color: fitnessColor(p.fitness) }]}>{p.fitness}</Text>
                  </View>
                  {p.injured && (
                    <Text style={s.injured}>
                      <Ionicons name="medkit" size={11} color={C.red} /> Травма · {p.injuryDaysLeft} дн
                    </Text>
                  )}
                  {p.transferStatus === 'LISTED' && (
                    <Text style={s.listed}>
                      <Ionicons name="pricetag" size={11} color={C.gold} /> Выставлен · {p.askingPrice ? `€${(Number(p.askingPrice)/1_000_000).toFixed(1)}M` : ''}
                    </Text>
                  )}
                  {p.transferStatus === 'LISTED_FOR_LOAN' && (
                    <Text style={[s.listed, { color: C.accent }]}>
                      <Ionicons name="swap-horizontal" size={11} color={C.accent} /> В аренду
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={s.listBtn}
                  onPress={() => setActionFor(p)}
                  testID="list-action"
                >
                  <Ionicons name="ellipsis-vertical" size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      />

      <Modal visible={actionFor !== null} transparent animationType="slide" onRequestClose={() => setActionFor(null)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{actionFor?.firstName} {actionFor?.lastName}</Text>
              <TouchableOpacity onPress={() => setActionFor(null)}>
                <Ionicons name="close" size={24} color={C.muted} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 14 }}>
              {actionFor?.transferStatus === 'LISTED' || actionFor?.transferStatus === 'LISTED_FOR_LOAN' ? (
                <TouchableOpacity
                  style={[s.modalBtn, { borderColor: C.red, backgroundColor: 'rgba(231,76,60,0.1)' }]}
                  onPress={async () => {
                    try {
                      await api.post('/transfers/unlist', { playerId: actionFor.id });
                      setActionFor(null);
                      load();
                    } catch (err) {
                      Alert.alert('Ошибка', err.response?.data?.error || err.message);
                    }
                  }}
                >
                  <Ionicons name="close-circle" size={18} color={C.red} />
                  <Text style={[s.modalBtnText, { color: C.red }]}>СНЯТЬ С ПРОДАЖИ</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={s.typeRow}>
                    <TouchableOpacity
                      style={[s.typeChip, listType === 'SALE' && { backgroundColor: C.gold, borderColor: C.gold }]}
                      onPress={() => setListType('SALE')}
                    >
                      <Text style={[s.typeChipText, listType === 'SALE' && { color: C.bg }]}>ПРОДАЖА</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.typeChip, listType === 'LOAN' && { backgroundColor: C.accent, borderColor: C.accent }]}
                      onPress={() => setListType('LOAN')}
                    >
                      <Text style={[s.typeChipText, listType === 'LOAN' && { color: C.bg }]}>В АРЕНДУ</Text>
                    </TouchableOpacity>
                  </View>

                  {listType === 'SALE' && (
                    <>
                      <Text style={s.formLabel}>ЦЕНА (M€)</Text>
                      <TextInput
                        style={s.input}
                        value={listPrice}
                        onChangeText={setListPrice}
                        keyboardType="numeric"
                        placeholder={actionFor ? `${Math.round(Number(actionFor.marketValue || 0) / 1_000_000)}` : '0'}
                        placeholderTextColor={C.subtle}
                      />
                    </>
                  )}

                  <TouchableOpacity
                    style={[s.modalBtn, { borderColor: C.green, backgroundColor: 'rgba(46,204,113,0.1)', marginTop: 16 }]}
                    onPress={async () => {
                      try {
                        const body = {
                          playerId: actionFor.id,
                          type: listType,
                          askingPrice: listType === 'SALE'
                            ? Number(listPrice || (Number(actionFor.marketValue || 0) / 1_000_000)) * 1_000_000
                            : null,
                        };
                        await api.post('/transfers/list', body);
                        setActionFor(null);
                        setListPrice('');
                        load();
                        Alert.alert('Выставлен', listType === 'SALE' ? 'Игрок на продажу' : 'Игрок в аренду');
                      } catch (err) {
                        Alert.alert('Ошибка', err.response?.data?.error || err.message);
                      }
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={C.green} />
                    <Text style={[s.modalBtnText, { color: C.green }]}>ВЫСТАВИТЬ</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  headerTitle: { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  headerBadges: { flexDirection: 'row', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: C.borderActive,
    marginBottom: 8,
  },
  sectionTitle: { color: C.muted, fontWeight: '800', fontSize: 10, letterSpacing: 1.5 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.cardDeep,
    padding: 12, marginBottom: 6, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
  },
  rowInjured: { borderColor: 'rgba(231,76,60,0.4)', opacity: 0.7 },

  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(79,195,247,0.08)',
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: C.text, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: C.text, fontSize: 14, fontWeight: '700', flex: 1 },
  ovr: { color: C.accent, fontSize: 15, fontWeight: '800', marginLeft: 8 },
  sub: { color: C.muted, fontSize: 10, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },

  fitRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  fitLabel: { color: C.subtle, fontSize: 8, fontWeight: '800', width: 20 },
  fitBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginHorizontal: 6, overflow: 'hidden' },
  fitFill: { height: '100%', borderRadius: 2 },
  fitNum: { fontSize: 9, fontWeight: '800', width: 22, textAlign: 'right' },

  injured: { color: C.red, fontSize: 11, fontWeight: '600', marginTop: 6 },
  listed: { color: C.gold, fontSize: 11, fontWeight: '700', marginTop: 6 },
  listBtn: { padding: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 14, borderRadius: 10, borderWidth: 1.5,
  },
  modalBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
  },
  typeChipText: { color: C.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  formLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: C.text, fontSize: 16, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
  },
});
