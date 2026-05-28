import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, FlatList } from 'react-native';
import { FORMATIONS, STYLES, MENTALITIES, GROUP } from '../data/tactics';
import FieldPlayerCard from '../components/FieldPlayerCard';
import { buildAutoLineup } from '../utils/autoLineup';
import { loadManagerData, loadSession } from '../utils/storage';
import { api } from '../utils/api';

const { width: SW } = Dimensions.get('window');
const FIELD_W = SW - 32;
const FIELD_H = FIELD_W * 1.4;

const POS_COLORS = {
  GK: '#f59e0b',
  CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6', LWB: '#3b82f6', RWB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981', LM: '#10b981', RM: '#10b981',
  LW: '#ef4444', RW: '#ef4444', ST: '#ef4444',
};


const getGroup = (pos) => {
  for (const [g, arr] of Object.entries(GROUP)) {
    if (arr.includes(pos)) return g;
  }
  return null;
};

// Приоритеты для автозаполнения

export default function TacticsScreen() {
  const [formation, setFormation] = useState('4-3-3');
  const [style, setStyle] = useState('balanced');
  const [mentality, setMentality] = useState('balanced');
  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState({});
  const [tab, setTab] = useState('formation');
  const [token, setToken] = useState(null);
  const [selectingPos, setSelectingPos] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { token } = await loadSession();
    const { club } = await loadManagerData();
    setToken(token);
    if (club) {
      const p = await api.getPlayers(club.id);
      setPlayers(p);
    }
    if (token) {
      const t = await api.loadTactics(token);
      if (t && !t.detail) {
        if (t.formation) setFormation(t.formation);
        if (t.style) setStyle(t.style);
        if (t.mentality) setMentality(t.mentality);
        if (t.lineup) setLineup(t.lineup);
      }
    }
  };

  const save = async (updates = {}) => {
    if (!token) return;
    await api.saveTactics(token, {
      formation: updates.formation ?? formation,
      style: updates.style ?? style,
      mentality: updates.mentality ?? mentality,
      lineup: updates.lineup !== undefined ? updates.lineup : lineup,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const autoFill = () => {
    const newLineup = buildAutoLineup(players, formation);
    setLineup(newLineup);
    save({ lineup: newLineup });
  };
  const _autoFill_old = () => {
    const current = FORMATIONS[formation];
    const used = new Set();
    const newLineup = {};

    for (const pos of current.positions) {
      const priorities = PRIORITY[pos.label] || [pos.label];
      for (const prio of priorities) {
        const candidate = players.find(p => p.position === prio && !used.has(p.id));
        if (candidate) {
          newLineup[pos.id] = candidate;
          used.add(candidate.id);
          break;
        }
      }
    }
    setLineup(newLineup);
    save({ lineup: newLineup });
  };

  const handleFormationChange = (f) => {
    setFormation(f);
    setLineup({});
    save({ formation: f, lineup: {} });
  };

  const handlePositionTap = (posId) => setSelectingPos(posId);

  const handlePlayerSelect = (player) => {
    const newLineup = { ...lineup, [selectingPos]: player };
    setLineup(newLineup);
    setSelectingPos(null);
    save({ lineup: newLineup });
  };

  const handleRemovePlayer = (posId) => {
    const newLineup = { ...lineup };
    delete newLineup[posId];
    setLineup(newLineup);
    save({ lineup: newLineup });
  };

  const currentFormation = FORMATIONS[formation];
  const usedPlayerIds = Object.values(lineup).map(p => p?.id).filter(Boolean);

  // Фильтр игроков для выбранной позиции
  const posLabel = currentFormation?.positions.find(p => p.id === selectingPos)?.label;
  const posGroup = posLabel ? getGroup(posLabel) : null;
  const groupPositions = posGroup ? GROUP[posGroup] : [];

  const filteredPlayers = players.filter(p => {
    const alreadyUsed = usedPlayerIds.includes(p.id) && lineup[selectingPos]?.id !== p.id;
    if (alreadyUsed) return false;
    return groupPositions.includes(p.position);
  });

  const renderField = () => (
    <View style={[s.field, { width: FIELD_W, height: FIELD_H }]}>
      <View style={s.fieldCircle} />
      <View style={s.fieldMidLine} />
      <View style={s.fieldPenaltyTop} />
      <View style={s.fieldPenaltyBottom} />
      {currentFormation.positions.map(pos => {
        const player = lineup[pos.id];
        return (
          <View
            key={pos.id}
            style={{ position: 'absolute', left: (pos.x / 100) * FIELD_W - 22, top: (pos.y / 100) * FIELD_H - 30 }}
          >
            <FieldPlayerCard
              pos={pos}
              player={player}
              onPress={() => handlePositionTap(pos.id)}
              onLongPress={() => player && handleRemovePlayer(pos.id)}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ТАКТИКА</Text>
        <View style={s.headerRight}>
          {saved && <Text style={s.savedBadge}>✓ СОХРАНЕНО</Text>}
          <Text style={s.sub}>{formation} · {Object.keys(lineup).length}/11</Text>
        </View>
      </View>

      <View style={s.tabs}>
        {[{ id: 'formation', label: 'СХЕМА' }, { id: 'style', label: 'СТИЛЬ' }, { id: 'mentality', label: 'МЕНТАЛ.' }].map(t => (
          <TouchableOpacity key={t.id} style={[s.tab, tab === t.id && s.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        {tab === 'formation' && (
          <>
            <View style={s.formationTopRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.formationRow}>
                {Object.keys(FORMATIONS).map(f => (
                  <TouchableOpacity key={f} style={[s.formationBtn, formation === f && s.formationActive]} onPress={() => handleFormationChange(f)}>
                    <Text style={[s.formationText, formation === f && s.formationTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={s.autoBtn} onPress={autoFill}>
                <Text style={s.autoBtnText}>⚡ АВТО</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.hint}>Тап — выбрать · Долгий тап — убрать</Text>
            {renderField()}
          </>
        )}

        {tab === 'style' && (
          <View style={s.styleList}>
            {STYLES.map(item => (
              <TouchableOpacity key={item.id} style={[s.styleCard, style === item.id && s.styleActive]} onPress={() => { setStyle(item.id); save({ style: item.id }); }}>
                <Text style={s.styleIcon}>{item.icon}</Text>
                <View style={s.styleInfo}>
                  <Text style={[s.styleLabel, style === item.id && s.styleLabelActive]}>{item.label}</Text>
                  <Text style={s.styleDesc}>{item.desc}</Text>
                </View>
                {style === item.id && <Text style={s.styleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'mentality' && (
          <View style={s.styleList}>
            <Text style={s.sectionHint}>Ментальность влияет на агрессивность и риск игры</Text>
            {MENTALITIES.map(item => (
              <TouchableOpacity key={item.id} style={[s.styleCard, mentality === item.id && s.styleActive]} onPress={() => { setMentality(item.id); save({ mentality: item.id }); }}>
                <View style={s.styleInfo}>
                  <Text style={[s.styleLabel, mentality === item.id && s.styleLabelActive]}>{item.label}</Text>
                </View>
                {mentality === item.id && <Text style={s.styleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Модалка выбора игрока */}
      <Modal visible={!!selectingPos} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>ВЫБЕРИ ИГРОКА</Text>
                <Text style={s.modalSub}>{posLabel} · {posGroup === 'GK' ? 'Вратари' : posGroup === 'DEF' ? 'Защитники' : posGroup === 'MID' ? 'Полузащитники' : 'Нападающие'}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectingPos(null)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {filteredPlayers.length === 0 ? (
              <View style={s.noPlayers}>
                <Text style={s.noPlayersText}>Нет доступных игроков</Text>
              </View>
            ) : (
              <FlatList
                data={filteredPlayers}
                keyExtractor={i => String(i.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.playerRow} onPress={() => handlePlayerSelect(item)}>
                    <View style={[s.miniPos, { backgroundColor: POS_COLORS[item.position] || '#666' }]}>
                      <Text style={s.miniPosText}>{item.position}</Text>
                    </View>
                    <View style={s.playerRowInfo}>
                      <Text style={s.playerRowName}>{item.name} {item.surname}</Text>
                      <Text style={s.playerRowNat}>{item.nationality} · {item.age} лет</Text>
                    </View>
                    <Text style={s.playerRowOvr}>{item.overall}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:              { flex: 1, backgroundColor: '#0a0a0f' },
  header:              { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRight:         { alignItems: 'flex-end' },
  title:               { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:                 { fontSize: 11, color: '#00d4ff', letterSpacing: 2 },
  savedBadge:          { fontSize: 10, color: '#00ff88', letterSpacing: 1, marginBottom: 2 },
  tabs:                { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:                 { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:           { backgroundColor: '#00d4ff' },
  tabText:             { fontSize: 11, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  tabTextActive:       { color: '#000' },
  inner:               { padding: 16, paddingBottom: 32 },
  formationTopRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  formationRow:        { gap: 8, paddingVertical: 4 },
  formationBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15' },
  formationActive:     { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  formationText:       { fontSize: 12, fontWeight: '800', color: '#8888aa' },
  formationTextActive: { color: '#000' },
  autoBtn:             { backgroundColor: '#7b2fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  autoBtnText:         { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  hint:                { fontSize: 10, color: '#8888aa', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  field:               { backgroundColor: '#0d4f1c', borderRadius: 12, overflow: 'hidden', alignSelf: 'center', borderWidth: 2, borderColor: '#ffffff20' },
  fieldCircle:         { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: '#ffffff30', top: '50%', left: '50%', marginTop: -40, marginLeft: -40 },
  fieldMidLine:        { position: 'absolute', width: '100%', height: 1, backgroundColor: '#ffffff30', top: '50%' },
  fieldPenaltyTop:     { position: 'absolute', width: '55%', height: '15%', borderWidth: 1, borderColor: '#ffffff30', top: 0, left: '22.5%', borderTopWidth: 0 },
  fieldPenaltyBottom:  { position: 'absolute', width: '55%', height: '15%', borderWidth: 1, borderColor: '#ffffff30', bottom: 0, left: '22.5%', borderBottomWidth: 0 },
  playerDot:           { position: 'absolute', alignItems: 'center', width: 48 },
  dotCircle:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dotLabel:            { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  dotName:             { fontSize: 8, color: '#fff', marginTop: 2, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 3 },
  styleList:           { gap: 10 },
  sectionHint:         { fontSize: 12, color: '#8888aa', marginBottom: 12, lineHeight: 18 },
  styleCard:           { backgroundColor: '#12121a', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#ffffff15' },
  styleActive:         { borderColor: '#00d4ff', backgroundColor: '#00d4ff15' },
  styleIcon:           { fontSize: 28 },
  styleInfo:           { flex: 1 },
  styleLabel:          { fontSize: 15, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  styleLabelActive:    { color: '#00d4ff' },
  styleDesc:           { fontSize: 12, color: '#8888aa', marginTop: 3 },
  styleCheck:          { fontSize: 18, color: '#00d4ff', fontWeight: '900' },
  overlay:             { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  modal:               { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', borderWidth: 1, borderColor: '#ffffff15' },
  modalHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  modalTitle:          { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  modalSub:            { fontSize: 11, color: '#00d4ff', marginTop: 2, letterSpacing: 1 },
  modalClose:          { fontSize: 18, color: '#8888aa' },
  noPlayers:           { padding: 40, alignItems: 'center' },
  noPlayersText:       { color: '#8888aa', fontSize: 14 },
  playerRow:           { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#ffffff08', gap: 12 },
  miniPos:             { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  miniPosText:         { fontSize: 9, fontWeight: '900', color: '#fff' },
  playerRowInfo:       { flex: 1 },
  playerRowName:       { fontSize: 14, fontWeight: '700', color: '#fff' },
  playerRowNat:        { fontSize: 11, color: '#8888aa', marginTop: 2 },
  playerRowOvr:        { fontSize: 16, fontWeight: '900', color: '#00d4ff' },
});
