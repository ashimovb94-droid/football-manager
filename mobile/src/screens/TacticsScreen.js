import { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Modal, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { C, FX, POSITION_GROUP, POS_COLOR, overall, fitnessColor } from '../design/theme';

const STADIUM = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80';

const STYLE_LABEL = {
  TIKI_TAKA: 'Тики-така', COUNTER_ATTACK: 'Контратаки',
  GEGENPRESSING: 'Прессинг', DIRECT: 'Прямой',
  POSSESSION: 'Контроль', PARK_THE_BUS: 'Автобус',
};
const MENT_LABEL = {
  VERY_DEFENSIVE: 'Очень оборонит.', DEFENSIVE: 'Оборонит.',
  BALANCED: 'Сбалансир.', ATTACKING: 'Атакующ.',
  VERY_ATTACKING: 'Очень атакующ.',
};
const LAYOUTS = {
  '4-3-3':   { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  '4-4-2':   { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  '3-5-2':   { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  '4-2-3-1': { GK: 1, DEF: 4, MID: 5, FWD: 1 },
  '5-3-2':   { GK: 1, DEF: 5, MID: 3, FWD: 2 },
};

const getInitials = (f, l) =>
  `${(f||'').charAt(0)}${(l||'').charAt(0)}`.toUpperCase();

export default function TacticsScreen({ navigation }) {
  const [tactic, setTactic] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formation, setFormation] = useState('4-3-3');
  const [style, setStyle] = useState('POSSESSION');
  const [mentality, setMentality] = useState('BALANCED');
  const [xi, setXi] = useState([]);
  const [bench, setBench] = useState([]);

  const [picker, setPicker] = useState(null);
  const [openSelect, setOpenSelect] = useState(null);

  const load = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        api.get('/my/tactic'),
        api.get('/my/squad'),
      ]);
      setTactic(tRes.data);
      setPlayers(sRes.data.players);
      setFormation(tRes.data.formation);
      setStyle(tRes.data.style);
      setMentality(tRes.data.mentality);
      setXi(tRes.data.startingXI);
      setBench(tRes.data.bench);
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async () => {
    if (xi.length !== 11) {
      Alert.alert('Не сохранить', 'В стартовом составе должно быть 11 игроков');
      return;
    }
    const injuredInXI = players.filter(p => xi.includes(p.id) && p.injured);
    if (injuredInXI.length > 0) {
      const names = injuredInXI.map(p => `${p.firstName} ${p.lastName}`).join(', ');
      Alert.alert('Травмированные в основе', `${names} — на матч не выйдут`);
      return;
    }
    setSaving(true);
    try {
      await api.post('/my/tactic', {
        formation, style, mentality,
        startingXI: xi, bench: bench.filter(Boolean),
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    } finally { setSaving(false); }
  }, [xi, bench, formation, style, mentality, players, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={save} disabled={saving} style={{ paddingHorizontal: 14 }}>
          {saving
            ? <ActivityIndicator size="small" color={C.green} />
            : <Ionicons name="checkmark-done" size={26} color={C.green} />}
        </TouchableOpacity>
      ),
    });
  }, [navigation, save, saving]);

  const autoFill = (newFormation) => {
    const layout = LAYOUTS[newFormation];
    if (!layout) return;
    const byGroup = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of players) {
      if (p.injured) continue;
      const g = POSITION_GROUP[p.position];
      if (g) byGroup[g].push(p);
    }
    for (const g of Object.keys(byGroup)) {
      byGroup[g].sort((a, b) => overall(b) - overall(a));
    }
    const newXi = [];
    for (const [g, count] of Object.entries(layout)) {
      newXi.push(...byGroup[g].slice(0, count).map(p => p.id));
    }
    const xiSet = new Set(newXi);
    const newBench = players
      .filter(p => !xiSet.has(p.id) && !p.injured)
      .sort((a, b) => overall(b) - overall(a))
      .slice(0, 7)
      .map(p => p.id);
    setXi(newXi);
    setBench(newBench);
  };

  const handleFormationChange = (f) => { setFormation(f); autoFill(f); };

  const getSlotGroup = (slotIndex, curr) => {
    const layout = LAYOUTS[curr];
    let i = 0;
    for (const [g, count] of Object.entries(layout)) {
      if (slotIndex < i + count) return g;
      i += count;
    }
    return 'MID';
  };

  const openPicker = (slotIndex, isBench) => {
    const groupRequired = isBench ? null : getSlotGroup(slotIndex, formation);
    setPicker({ slotIndex, isBench, groupRequired });
  };

  const pickPlayer = (playerId) => {
    if (!picker) return;
    const { slotIndex, isBench } = picker;
    if (isBench) {
      const nb = [...bench];
      nb[slotIndex] = playerId;
      setBench(nb);
    } else {
      const nx = [...xi];
      const exi = nx.indexOf(playerId);
      if (exi !== -1) nx[exi] = nx[slotIndex];
      nx[slotIndex] = playerId;
      setXi(nx);
      setBench(b => b.filter(id => id !== playerId));
    }
    setPicker(null);
  };

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  const playerById = (id) => players.find(p => p.id === id);
  const injuredInXICount = players.filter(p => xi.includes(p.id) && p.injured).length;

  // Линии: атака сверху, вратарь снизу
  const layout = LAYOUTS[formation];
  const lines = [];
  let idx = 0;
  for (const [g, count] of Object.entries(layout)) {
    lines.push({ group: g, ids: xi.slice(idx, idx + count), startIndex: idx });
    idx += count;
  }
  const reversed = [...lines].reverse();

  return (
    <ImageBackground source={{ uri: STADIUM }} style={s.bg} imageStyle={{ opacity: 0.4 }}>
      <View style={s.darkOverlay} />

      <ScrollView contentContainerStyle={{ paddingTop: 90, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        {/* ═══ ПОЛЕ ВЕРТИКАЛЬНОЕ ═══ */}
        <View style={s.pitch}>
          <View style={s.pitchMidLine} />
          <View style={s.pitchCircle} />
          <View style={[s.penaltyArc, { top: 0 }]} />
          <View style={[s.penaltyArc, { bottom: 0 }]} />

          <View style={s.linesWrap}>
            {reversed.map((line, lineIdx) => (
              <View key={lineIdx} style={s.line}>
                {line.ids.map((pid, i) => {
                  const p = playerById(pid);
                  const slotIndex = line.startIndex + i;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={s.slot}
                      onPress={() => openPicker(slotIndex, false)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        s.token,
                        { borderColor: POS_COLOR[line.group] },
                        p?.injured && s.tokenInjured,
                      ]}>
                        <Text style={s.tokenText}>
                          {p ? getInitials(p.firstName, p.lastName) : '?'}
                        </Text>
                        <View style={s.ovrBadge}>
                          <Text style={s.ovrText}>{p ? overall(p) : '?'}</Text>
                        </View>
                      </View>
                      <Text style={s.tokenName} numberOfLines={1}>
                        {p ? p.lastName : '—'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* ═══ ТРИ КНОПКИ-СЕЛЕКТА ═══ */}
        <View style={s.selectsRow}>
          <SelectBtn
            label="СТИЛЬ"
            value={STYLE_LABEL[style] || style}
            color={C.red}
            onPress={() => setOpenSelect('style')}
          />
          <SelectBtn
            label="СХЕМА"
            value={formation}
            color={C.accent}
            onPress={() => setOpenSelect('formation')}
          />
          <SelectBtn
            label="ТАКТИКА"
            value={MENT_LABEL[mentality] || mentality}
            color={C.green}
            onPress={() => setOpenSelect('ment')}
          />
        </View>

        {injuredInXICount > 0 && (
          <View style={s.alertBar}>
            <Ionicons name="warning-outline" size={14} color={C.red} />
            <Text style={s.alertText}>В основе {injuredInXICount} травмированных</Text>
          </View>
        )}

        {/* ═══ ЗАПАСНЫЕ ═══ */}
        <View style={s.benchSection}>
          <View style={s.benchHeader}>
            <Text style={s.benchTitle}>ЗАПАСНЫЕ</Text>
            <Text style={s.benchCount}>{bench.filter(Boolean).length}/7</Text>
          </View>
          <View style={s.benchRow}>
            {Array.from({ length: 7 }).map((_, i) => {
              const p = playerById(bench[i]);
              return (
                <TouchableOpacity
                  key={i}
                  style={s.benchSlot}
                  onPress={() => openPicker(i, true)}
                  activeOpacity={0.7}
                >
                  {p ? (
                    <>
                      <View style={[
                        s.benchToken,
                        { borderColor: POS_COLOR[POSITION_GROUP[p.position]] },
                        p.injured && s.tokenInjured,
                      ]}>
                        <Text style={s.benchTokenText}>{getInitials(p.firstName, p.lastName)}</Text>
                      </View>
                      <Text style={s.benchName} numberOfLines={1}>{p.lastName}</Text>
                    </>
                  ) : (
                    <Ionicons name="add" size={20} color={C.subtle} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ═══ МОДАЛКА ВЫБОРА ИГРОКА ═══ */}
      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {picker?.isBench ? 'НА СКАМЕЙКУ' : `ВЫБРАТЬ ${picker?.groupRequired}`}
              </Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color={C.muted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                picker
                  ? (picker.isBench
                      ? players.filter(p => !xi.includes(p.id))
                      : players.filter(p => POSITION_GROUP[p.position] === picker.groupRequired))
                    .sort((a, b) => {
                      if (a.injured !== b.injured) return a.injured ? 1 : -1;
                      return overall(b) - overall(a);
                    })
                  : []
              }
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => {
                const inXi = xi.includes(item.id);
                const inBench = bench.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[s.modalItem, item.injured && s.modalItemInjured]}
                    onPress={() => pickPlayer(item.id)}
                  >
                    <View style={[s.modalAvatar, { borderColor: POS_COLOR[POSITION_GROUP[item.position]] }]}>
                      <Text style={s.modalAvatarText}>{getInitials(item.firstName, item.lastName)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[s.modalName, item.injured && { color: C.muted }]}>
                        {item.injured ? '🩹 ' : ''}{item.firstName} {item.lastName}
                      </Text>
                      <Text style={s.modalMeta}>
                        {item.position} · {item.age}л · фит{' '}
                        <Text style={{ color: fitnessColor(item.fitness) }}>{item.fitness}</Text>
                        {item.injured ? ` · травма ${item.injuryDaysLeft}д` : ''}
                        {inXi ? ' · в составе' : inBench ? ' · в запасе' : ''}
                      </Text>
                    </View>
                    <Text style={s.modalOvr}>{overall(item)}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ═══ ВЫПАДАЮЩИЕ СПИСКИ ═══ */}
      <DropdownModal
        visible={openSelect === 'style'} title="СТИЛЬ ИГРЫ"
        items={tactic.availableStyles} current={style} labels={STYLE_LABEL} color={C.red}
        onPick={(v) => { setStyle(v); setOpenSelect(null); }}
        onClose={() => setOpenSelect(null)}
      />
      <DropdownModal
        visible={openSelect === 'formation'} title="СХЕМА"
        items={tactic.availableFormations} current={formation} labels={null} color={C.accent}
        onPick={(v) => { handleFormationChange(v); setOpenSelect(null); }}
        onClose={() => setOpenSelect(null)}
      />
      <DropdownModal
        visible={openSelect === 'ment'} title="МЕНТАЛЬНОСТЬ"
        items={tactic.availableMentalities} current={mentality} labels={MENT_LABEL} color={C.green}
        onPick={(v) => { setMentality(v); setOpenSelect(null); }}
        onClose={() => setOpenSelect(null)}
      />
    </ImageBackground>
  );
}

function SelectBtn({ label, value, color, onPress }) {
  return (
    <TouchableOpacity style={[s.selectBtn, { borderColor: color }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.selectLabel, { color }]}>{label}</Text>
      <View style={s.selectValue}>
        <Text style={s.selectValueText} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={12} color={C.muted} />
      </View>
    </TouchableOpacity>
  );
}

function DropdownModal({ visible, title, items, current, labels, color, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={onClose}>
        <View style={[s.ddBox, { borderColor: color }]}>
          <Text style={[s.modalTitle, { color, marginBottom: 8 }]}>{title}</Text>
          {items.map(v => (
            <TouchableOpacity
              key={v}
              style={[s.ddItem, current === v && { backgroundColor: `${color}22` }]}
              onPress={() => onPick(v)}
            >
              <Text style={[s.ddItemText, current === v && { color }]}>
                {labels?.[v] || v}
              </Text>
              {current === v && <Ionicons name="checkmark" size={18} color={color} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.bg },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,14,23,0.55)' },

  // ═══ Поле ═══
  pitch: {
    marginHorizontal: 12,
    aspectRatio: 0.85,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    position: 'relative',
    paddingVertical: 10,
    backgroundColor: 'rgba(20, 60, 35, 0.18)',
  },
  pitchMidLine: {
    position: 'absolute', left: 0, right: 0, top: '50%',
    height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pitchCircle: {
    position: 'absolute', alignSelf: 'center', top: '42%',
    width: '22%', aspectRatio: 1, borderRadius: 999,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  penaltyArc: {
    position: 'absolute', alignSelf: 'center',
    width: '50%', height: '14%',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  linesWrap: { flex: 1, justifyContent: 'space-between' },
  line: {
    flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
  },

  slot: { alignItems: 'center' },
  token: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(10,15,25,0.92)',
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  tokenInjured: { opacity: 0.5, borderColor: C.red },
  tokenText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  ovrBadge: {
    position: 'absolute', top: -5, right: -7,
    backgroundColor: C.bg,
    borderRadius: 7, borderWidth: 1, borderColor: C.gold,
    paddingHorizontal: 3,
    minWidth: 17, alignItems: 'center',
  },
  ovrText: { color: C.gold, fontSize: 9, fontWeight: '900' },
  tokenName: {
    color: '#fff', fontSize: 9, fontWeight: '700',
    marginTop: 3, maxWidth: 60, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ═══ Селекты ═══
  selectsRow: {
    flexDirection: 'row',
    marginHorizontal: 12, marginTop: 14, gap: 8,
  },
  selectBtn: {
    flex: 1,
    backgroundColor: 'rgba(22,30,43,0.75)',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 10, paddingHorizontal: 10,
  },
  selectLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  selectValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  selectValueText: { color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 },

  alertBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 12, marginTop: 10, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(231,76,60,0.15)', borderRadius: 8,
    borderLeftWidth: 3, borderLeftColor: C.red,
  },
  alertText: { color: C.red, fontSize: 11, fontWeight: '600' },

  // ═══ Запасные ═══
  benchSection: { marginTop: 16, marginHorizontal: 12 },
  benchHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 8,
  },
  benchTitle: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  benchCount: { color: C.accent, fontSize: 11, fontWeight: '700' },
  benchRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 4,
  },
  benchSlot: {
    flex: 1, minHeight: 64,
    backgroundColor: 'rgba(22,30,43,0.75)',
    borderRadius: 8, padding: 5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  benchToken: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(10,15,25,0.85)',
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  benchTokenText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  benchName: { color: '#fff', fontSize: 8, marginTop: 3, fontWeight: '600' },

  // ═══ Модалки ═══
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: C.bg, maxHeight: '82%',
    borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 12,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 12, justifyContent: 'space-between',
  },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
  },
  modalItemInjured: { opacity: 0.5 },
  modalAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalName: { color: C.text, fontSize: 13, fontWeight: '600' },
  modalMeta: { color: C.muted, fontSize: 11, marginTop: 2 },
  modalOvr: { color: C.accent, fontSize: 18, fontWeight: '800', marginRight: 8 },

  ddBox: {
    backgroundColor: C.bg, margin: 24,
    borderRadius: 14, padding: 14,
    borderWidth: 1.5,
  },
  ddItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8,
  },
  ddItemText: { color: C.text, fontSize: 14, fontWeight: '600' },
});
