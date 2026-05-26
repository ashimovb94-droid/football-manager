import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { C, FX } from '../design/theme';

const POSITIONS = ['ANY','GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST'];

const SPEC_LABEL = {
  WORLDWIDE: 'По всему миру',
  ENGLAND: 'Англия',
  EUROPE: 'Европа',
  SOUTH_AMERICA: 'Ю. Америка',
  AFRICA: 'Африка',
  ASIA: 'Азия',
};

const fmtM = (s) => {
  const n = Number(s);
  if (n >= 1_000_000) return `€${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n/1_000).toFixed(0)}K`;
  return `€${n}`;
};

const STARS = (level) => '★'.repeat(level) + '☆'.repeat(5 - level);

function useCountdown(target) {
  const [str, setStr] = useState('');
  useEffect(() => {
    if (!target) { setStr(''); return; }
    const tick = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) { setStr('готово'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setStr(`${h}ч ${m}м`);
    };
    tick();
    const iv = setInterval(tick, 30000);
    return () => clearInterval(iv);
  }, [target]);
  return str;
}

export default function ScoutsScreen({ navigation }) {
  const [tab, setTab] = useState('my'); // my | hire
  const [scouts, setScouts] = useState([]);
  const [missions, setMissions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [missionFor, setMissionFor] = useState(null);
  const [missionPos, setMissionPos] = useState('ANY');
  const [missionMaxBudget, setMissionMaxBudget] = useState('20');
  const [missionMinAge, setMissionMinAge] = useState('18');
  const [missionMaxAge, setMissionMaxAge] = useState('30');

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        api.get('/scouts/my'),
        api.get('/scouts/missions'),
      ]);
      setScouts(s.data);
      setMissions(m.data);

      if (tab === 'hire') {
        const c = await api.get('/scouts/available');
        setCandidates(c.data);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendMission = async () => {
    if (!missionFor) return;
    try {
      await api.post('/scouts/missions/new', {
        scoutId: missionFor.id,
        position: missionPos === 'ANY' ? null : missionPos,
        minAge: Number(missionMinAge),
        maxAge: Number(missionMaxAge),
        maxBudget: Number(missionMaxBudget) * 1_000_000,
      });
      setMissionFor(null);
      load();
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    }
  };

  const hire = (c) => {
    Alert.alert(
      `Нанять ${c.name}?`,
      `Уровень: ${STARS(c.level)}\nСтоимость: ${fmtM(c.hireCost)}\nЗ/п: ${fmtM(c.weeklyWage)}/нед`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Нанять',
          onPress: async () => {
            try {
              await api.post('/scouts/hire', {
                name: c.name,
                level: c.level,
                specialization: c.specialization,
              });
              Alert.alert('✓ Нанят!', `${c.name} в команде скаутов`);
              setTab('my');
              load();
            } catch (err) {
              Alert.alert('Ошибка', err.response?.data?.error || err.message);
            }
          },
        },
      ],
    );
  };

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  // Завершённые отчёты
  const reports = missions.filter(m => m.status === 'COMPLETED' && m.results);

  return (
    <View style={FX.bg}>
      <View style={s.tabsRow}>
        <Tab label="МОИ СКАУТЫ" active={tab==='my'} onPress={() => setTab('my')} />
        <Tab label="НАНЯТЬ" active={tab==='hire'} onPress={() => { setTab('hire'); load(); }} />
      </View>

      {tab === 'my' ? (
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        >
          {/* Мои скауты */}
          <Text style={s.sectionLabel}>МОЯ КОМАНДА СКАУТОВ ({scouts.length}/4)</Text>
          {scouts.length === 0 && (
            <Text style={s.empty}>У вас нет скаутов. Перейдите на вкладку НАНЯТЬ</Text>
          )}
          {scouts.map(sc => (
            <ScoutCard key={sc.id} scout={sc} onAssign={() => setMissionFor(sc)} />
          ))}

          {/* Отчёты */}
          {reports.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 18 }]}>ГОТОВЫЕ ОТЧЁТЫ</Text>
              {reports.map(r => (
                <ReportCard key={r.id} report={r} navigation={navigation} onDismiss={async () => {
                  await api.post('/scouts/missions/dismiss', { missionId: r.id });
                  load();
                }} />
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
          ListEmptyComponent={<Text style={s.empty}>Нет доступных кандидатов</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.candCard} onPress={() => hire(item)} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={s.candName}>{item.name}</Text>
                <Text style={s.candStars}>{STARS(item.level)}</Text>
                <Text style={s.candSub}>{SPEC_LABEL[item.specialization] || item.specialization}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.candCost}>{fmtM(item.hireCost)}</Text>
                <Text style={s.candWage}>{fmtM(item.weeklyWage)}/нед</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Модалка задания */}
      <Modal visible={missionFor !== null} transparent animationType="slide" onRequestClose={() => setMissionFor(null)}>
        <View style={s.modalBg}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>ЗАДАНИЕ: {missionFor?.name?.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setMissionFor(null)}>
                <Ionicons name="close" size={24} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 14 }}>
              <Text style={s.formLabel}>ПОЗИЦИЯ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {POSITIONS.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[s.posChip, missionPos === p && s.posChipActive]}
                      onPress={() => setMissionPos(p)}
                    >
                      <Text style={[s.posChipText, missionPos === p && { color: C.bg }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>ВОЗРАСТ ОТ</Text>
                  <TextInput
                    style={s.input}
                    value={missionMinAge}
                    onChangeText={setMissionMinAge}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.formLabel}>ДО</Text>
                  <TextInput
                    style={s.input}
                    value={missionMaxAge}
                    onChangeText={setMissionMaxAge}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <Text style={s.formLabel}>МАКС. ЦЕНА (M€)</Text>
                <TextInput
                  style={s.input}
                  value={missionMaxBudget}
                  onChangeText={setMissionMaxBudget}
                  keyboardType="numeric"
                />
              </View>

              <View style={s.infoBlock}>
                <Ionicons name="time-outline" size={14} color={C.muted} />
                <Text style={s.infoText}>Скаут вернётся с отчётом через 24 часа</Text>
              </View>

              <TouchableOpacity style={s.submitBtn} onPress={sendMission}>
                <Ionicons name="paper-plane" size={16} color={C.green} />
                <Text style={s.submitText}>ОТПРАВИТЬ НА ПОИСК</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

function ScoutCard({ scout, onAssign }) {
  const cd = useCountdown(scout.activeMission?.completesAt);
  const busy = scout.activeMission?.status === 'IN_PROGRESS';
  const ready = scout.activeMission?.status === 'COMPLETED' || cd === 'готово';

  return (
    <View style={s.scoutCard}>
      <View style={s.scoutTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.scoutName}>{scout.name}</Text>
          <Text style={s.scoutStars}>{STARS(scout.level)}</Text>
          <Text style={s.scoutSpec}>{SPEC_LABEL[scout.specialization] || scout.specialization}</Text>
        </View>
        {!busy && !ready && (
          <TouchableOpacity style={s.assignBtn} onPress={onAssign}>
            <Ionicons name="search" size={14} color={C.accent} />
            <Text style={s.assignText}>ЗАДАНИЕ</Text>
          </TouchableOpacity>
        )}
        {busy && cd !== 'готово' && (
          <View style={s.busyBadge}>
            <Ionicons name="time-outline" size={12} color={C.gold} />
            <Text style={s.busyText}>{cd}</Text>
          </View>
        )}
        {ready && (
          <View style={s.readyBadge}>
            <Ionicons name="checkmark-circle" size={12} color={C.green} />
            <Text style={s.readyText}>ОТЧЁТ</Text>
          </View>
        )}
      </View>
      {busy && scout.activeMission?.position && (
        <Text style={s.missionInfo}>Ищет: {scout.activeMission.position}</Text>
      )}
    </View>
  );
}

function ReportCard({ report, navigation, onDismiss }) {
  const results = report.results || [];
  return (
    <View style={s.reportCard}>
      <View style={s.reportHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.reportTitle}>
            {report.scoutName} <Text style={{ color: C.muted, fontSize: 11 }}>{STARS(report.scoutLevel)}</Text>
          </Text>
          <Text style={s.reportMeta}>
            {report.position || 'Любая позиция'} · {report.minAge}-{report.maxAge}л · до {fmtM(report.maxBudget)}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss}>
          <Ionicons name="close-circle-outline" size={20} color={C.muted} />
        </TouchableOpacity>
      </View>
      <Text style={s.reportFound}>НАЙДЕНО {results.length} КАНДИДАТОВ:</Text>
      {results.map((r, i) => (
        <TouchableOpacity
          key={i}
          style={s.reportItem}
          onPress={() => navigation.navigate('PlayerOffer', { playerId: r.playerId, mode: 'market' })}
          activeOpacity={0.7}
        >
          <Text style={s.reportOvr}>~{r.perceivedOverall}</Text>
          <Text style={s.reportArrow}>→</Text>
          <Text style={s.reportItemText}>Открыть профиль</Text>
        </TouchableOpacity>
      ))}
      
    </View>
  );
}

const s = StyleSheet.create({
  tabsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tabActive: { color: C.accent },
  tabUnderline: { height: 2, backgroundColor: C.accent, width: '60%', marginTop: 6 },

  sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  empty: { color: C.subtle, textAlign: 'center', padding: 30 },

  scoutCard: {
    backgroundColor: C.card, padding: 14, marginBottom: 8,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  scoutTop: { flexDirection: 'row', alignItems: 'center' },
  scoutName: { color: C.text, fontSize: 14, fontWeight: '800' },
  scoutStars: { color: C.gold, fontSize: 14, letterSpacing: 2, marginTop: 4 },
  scoutSpec: { color: C.muted, fontSize: 11, marginTop: 4 },
  missionInfo: { color: C.accent, fontSize: 11, marginTop: 8, fontStyle: 'italic' },

  assignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(79,195,247,0.1)',
    borderRadius: 8, borderWidth: 1, borderColor: C.accent,
  },
  assignText: { color: C.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  busyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(241,196,15,0.1)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(241,196,15,0.3)',
  },
  busyText: { color: C.gold, fontSize: 11, fontWeight: '700' },

  readyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(46,204,113,0.15)',
    borderRadius: 8, borderWidth: 1, borderColor: C.green,
  },
  readyText: { color: C.green, fontSize: 11, fontWeight: '800' },

  candCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, padding: 14, marginBottom: 8,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  candName: { color: C.text, fontSize: 14, fontWeight: '700' },
  candStars: { color: C.gold, fontSize: 14, letterSpacing: 2, marginTop: 4 },
  candSub: { color: C.muted, fontSize: 11, marginTop: 4 },
  candCost: { color: C.accent, fontSize: 14, fontWeight: '800' },
  candWage: { color: C.muted, fontSize: 10, marginTop: 4 },

  reportCard: {
    backgroundColor: C.card, padding: 14, marginBottom: 8,
    borderRadius: 10, borderLeftWidth: 4, borderLeftColor: C.green,
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderTopColor: C.border, borderRightColor: C.border, borderBottomColor: C.border,
  },
  reportHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  reportTitle: { color: C.text, fontSize: 13, fontWeight: '800' },
  reportMeta: { color: C.muted, fontSize: 11, marginTop: 4 },
  reportFound: { color: C.green, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 10, marginBottom: 6 },
  reportItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 6, marginBottom: 4,
  },
  reportOvr: { color: C.gold, fontSize: 14, fontWeight: '800', width: 36 },
  reportArrow: { color: C.subtle, fontSize: 14 },
  reportItemText: { color: C.text, fontSize: 12, flex: 1 },
  reportMore: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },

  // Модалка
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.bg, maxHeight: '85%', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitle: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  formLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: C.text, fontSize: 16, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
  },
  posChip: {
    paddingHorizontal: 14, height: 28,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  posChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  posChipText: { color: C.muted, fontSize: 11, fontWeight: '700' },

  infoBlock: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, padding: 10,
    backgroundColor: 'rgba(79,195,247,0.08)',
    borderRadius: 8, borderLeftWidth: 3, borderLeftColor: C.accent,
  },
  infoText: { color: C.muted, fontSize: 11 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 18, padding: 14, borderRadius: 10,
    backgroundColor: 'rgba(46,204,113,0.15)',
    borderWidth: 1.5, borderColor: C.green,
  },
  submitText: { color: C.green, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});
