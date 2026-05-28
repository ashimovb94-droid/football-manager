import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { FORMATIONS, STYLES, MENTALITIES } from '../data/tactics';
import { loadManagerData } from '../utils/storage';
import { api } from '../utils/api';

const { width: SW } = Dimensions.get('window');
const FIELD_W = SW - 32;
const FIELD_H = FIELD_W * 1.4;

const POS_COLORS = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6',
  RWB: '#3b82f6', LWB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981',
  RM: '#10b981', LM: '#10b981',
  RW: '#ef4444', LW: '#ef4444', ST: '#ef4444',
};

export default function TacticsScreen() {
  const [formation, setFormation] = useState('4-3-3');
  const [style, setStyle] = useState('balanced');
  const [mentality, setMentality] = useState('balanced');
  const [players, setPlayers] = useState([]);
  const [assigned, setAssigned] = useState({});
  const [tab, setTab] = useState('formation');

  useEffect(() => {
    loadManagerData().then(({ club }) => {
      if (club) api.getPlayers(club.id).then(setPlayers);
    });
  }, []);

  const currentFormation = FORMATIONS[formation];

  const renderField = () => (
    <View style={[s.field, { width: FIELD_W, height: FIELD_H }]}>
      {/* Разметка поля */}
      <View style={s.fieldCircle} />
      <View style={s.fieldMidLine} />
      <View style={s.fieldPenaltyTop} />
      <View style={s.fieldPenaltyBottom} />

      {/* Игроки на поле */}
      {currentFormation.positions.map(pos => {
        const player = assigned[pos.id];
        const color = POS_COLORS[pos.label] || '#666';
        return (
          <View
            key={pos.id}
            style={[s.playerDot, {
              left: (pos.x / 100) * FIELD_W - 24,
              top: (pos.y / 100) * FIELD_H - 28,
            }]}
          >
            <View style={[s.dotCircle, { backgroundColor: color }]}>
              <Text style={s.dotLabel}>{pos.label}</Text>
            </View>
            <Text style={s.dotName} numberOfLines={1}>
              {player ? player.surname : '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ТАКТИКА</Text>
        <Text style={s.sub}>{formation} · {STYLES.find(s => s.id === style)?.label}</Text>
      </View>

      {/* Табы */}
      <View style={s.tabs}>
        {[
          { id: 'formation', label: 'СХЕМА' },
          { id: 'style',     label: 'СТИЛЬ' },
          { id: 'mentality', label: 'МЕНТАЛ.' },
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.tab, tab === t.id && s.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        {tab === 'formation' && (
          <>
            {/* Выбор схемы */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.formationRow}>
              {Object.keys(FORMATIONS).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[s.formationBtn, formation === f && s.formationActive]}
                  onPress={() => setFormation(f)}
                >
                  <Text style={[s.formationText, formation === f && s.formationTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Поле */}
            {renderField()}
          </>
        )}

        {tab === 'style' && (
          <View style={s.styleList}>
            {STYLES.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[s.styleCard, style === item.id && s.styleActive]}
                onPress={() => setStyle(item.id)}
              >
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
              <TouchableOpacity
                key={item.id}
                style={[s.styleCard, mentality === item.id && s.styleActive]}
                onPress={() => setMentality(item.id)}
              >
                <View style={s.styleInfo}>
                  <Text style={[s.styleLabel, mentality === item.id && s.styleLabelActive]}>{item.label}</Text>
                </View>
                {mentality === item.id && <Text style={s.styleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:              { flex: 1, backgroundColor: '#0a0a0f' },
  header:              { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  title:               { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:                 { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  tabs:                { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:                 { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:           { backgroundColor: '#00d4ff' },
  tabText:             { fontSize: 11, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  tabTextActive:       { color: '#000' },
  inner:               { padding: 16, paddingBottom: 32 },
  formationRow:        { gap: 8, marginBottom: 16, paddingVertical: 4 },
  formationBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15' },
  formationActive:     { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  formationText:       { fontSize: 12, fontWeight: '800', color: '#8888aa' },
  formationTextActive: { color: '#000' },
  field:               { backgroundColor: '#0d4f1c', borderRadius: 12, overflow: 'hidden', alignSelf: 'center', borderWidth: 2, borderColor: '#ffffff20' },
  fieldCircle:         { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: '#ffffff30', top: '50%', left: '50%', marginTop: -40, marginLeft: -40 },
  fieldMidLine:        { position: 'absolute', width: '100%', height: 1, backgroundColor: '#ffffff30', top: '50%' },
  fieldPenaltyTop:     { position: 'absolute', width: '55%', height: '15%', borderWidth: 1, borderColor: '#ffffff30', top: 0, left: '22.5%', borderTopWidth: 0 },
  fieldPenaltyBottom:  { position: 'absolute', width: '55%', height: '15%', borderWidth: 1, borderColor: '#ffffff30', bottom: 0, left: '22.5%', borderBottomWidth: 0 },
  playerDot:           { position: 'absolute', alignItems: 'center', width: 48 },
  dotCircle:           { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
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
});
