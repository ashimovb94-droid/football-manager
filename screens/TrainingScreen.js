import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { loadSession, loadManagerData } from '../utils/storage';
import { api } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import PlayerAvatar from '../components/PlayerAvatar';

const FOCUS_LABELS = {
  shooting: 'УДАРЫ', passing: 'ПАСЫ', defending: 'ЗАЩИТА',
  gk: 'ВРАТАРСКАЯ', speed: 'СКОРОСТЬ', attack: 'АТАКА',
  defense: 'ОБОРОНА', fitness: 'ФИЗИЧЕСКАЯ', tactics: 'ТАКТИКА', standards: 'СТАНДАРТЫ',
};

const FOCUS_ICONS = {
  shooting: 'football-outline', passing: 'git-network-outline',
  defending: 'shield-outline', gk: 'hand-left-outline', speed: 'flash-outline',
  attack: 'arrow-up-outline', defense: 'shield-half-outline',
  fitness: 'barbell-outline', tactics: 'analytics-outline', standards: 'flag-outline',
};

const TEAM_DESCS = {
  attack: 'Улучшает атакующих игроков', defense: 'Улучшает защитников',
  fitness: 'Снижает усталость команды', tactics: 'Повышает моральный дух',
  standards: 'Улучшает полузащитников',
};

export default function TrainingScreen() {
  const [tab, setTab] = useState('team');
  const [types, setTypes] = useState({ team: [], individual: [] });
  const [active, setActive] = useState([]);
  const [players, setPlayers] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { token } = await loadSession();
    const { club } = await loadManagerData();
    setToken(token);
    const [t, a, p] = await Promise.all([
      api.getTrainingTypes(),
      api.getTrainingStatus(token),
      api.getPlayers(club.id),
    ]);
    setTypes(t);
    setActive(a || []);
    setPlayers(p || []);
  };

  const showMsg = (text, type = 'success') => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const startTeam = async (focus) => {
    setLoading(true);
    const res = await api.startTeamTraining(token, focus);
    if (res.success) {
      showMsg(res.message);
      setActive(await api.getTrainingStatus(token) || []);
    } else showMsg(res.detail || 'Ошибка', 'error');
    setLoading(false);
  };

  const assignIndividual = async () => {
    setLoading(true);
    const res = await api.autoIndividual(token);
    if (res.success) {
      showMsg(`✅ Назначено: ${res.assigned?.length || 0} тренировок`);
      setActive(await api.getTrainingStatus(token) || []);
    } else showMsg(res.detail || 'Ошибка', 'error');
    setLoading(false);
  };

  const teamActive = active.find(a => a.type === 'team');
  const indActive = active.filter(a => a.type?.startsWith('individual_'));

  const formatTime = (h) => {
    if (!h) return '';
    if (h < 1) return `${Math.round(h * 60)} мин`;
    if (h < 24) return `${Math.round(h)} ч`;
    return `${Math.floor(h / 24)}д ${Math.round(h % 24)}ч`;
  };

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ТРЕНИРОВКИ</Text>
        <Text style={s.sub}>ПОДГОТОВКА КОМАНДЫ</Text>
      </View>

      {message ? (
        <View style={[s.msgBanner, { backgroundColor: msgType === 'success' ? '#00ff8820' : '#ff335520' }]}>
          <Text style={[s.msgText, { color: msgType === 'success' ? '#00ff88' : '#ff3355' }]}>{message}</Text>
        </View>
      ) : null}

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'team' && s.tabActive]} onPress={() => setTab('team')}>
          <Text style={[s.tabText, tab === 'team' && s.tabTextActive]}>КОМАНДНАЯ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'individual' && s.tabActive]} onPress={() => setTab('individual')}>
          <Text style={[s.tabText, tab === 'individual' && s.tabTextActive]}>ИНДИВИДУАЛЬНАЯ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* КОМАНДНАЯ */}
        {tab === 'team' && (
          <>
            {teamActive && (
              <View style={s.activeCard}>
                <View style={s.activeHeader}>
                  <Ionicons name="time-outline" size={18} color="#00d4ff" />
                  <Text style={s.activeTitle}>ИДЁТ ТРЕНИРОВКА</Text>
                </View>
                <View style={s.activeRow}>
                  <Ionicons name={FOCUS_ICONS[teamActive.focus] || 'fitness-outline'} size={20} color="#00d4ff" />
                  <Text style={s.activeFocus}>{FOCUS_LABELS[teamActive.focus] || teamActive.focus}</Text>
                </View>
                <View style={s.activeRow}>
                  <Ionicons name={teamActive.completed ? 'checkmark-circle-outline' : 'hourglass-outline'} size={16} color={teamActive.completed ? '#00ff88' : '#8888aa'} />
                  <Text style={s.activeTime}>{teamActive.completed ? 'Завершена!' : `Осталось: ${formatTime(teamActive.hours_left)}`}</Text>
                </View>
              </View>
            )}

            <Text style={s.sectionTitle}>ВЫБЕРИ ФОКУС · 1 НЕДЕЛЯ</Text>
            {types.team?.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.trainingCard, teamActive?.focus === t.id && s.trainingCardActive, teamActive && teamActive.focus !== t.id && s.trainingCardDisabled]}
                onPress={() => !teamActive && startTeam(t.id)}
                disabled={!!teamActive || loading}
              >
                <View style={[s.trainingIcon, { backgroundColor: '#00d4ff20' }]}>
                  <Ionicons name={FOCUS_ICONS[t.id] || 'fitness-outline'} size={28} color="#00d4ff" />
                </View>
                <View style={s.trainingInfo}>
                  <Text style={s.trainingLabel}>{FOCUS_LABELS[t.id] || t.label}</Text>
                  <Text style={s.trainingDesc}>{TEAM_DESCS[t.id] || ''}</Text>
                </View>
                {teamActive?.focus === t.id
                  ? <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
                  : <Ionicons name="chevron-forward" size={20} color="#8888aa" />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ИНДИВИДУАЛЬНАЯ */}
        {tab === 'individual' && (
          <>
            {indActive.length > 0 && (
              <View style={s.activeCard}>
                <View style={s.activeHeader}>
                  <Ionicons name="people-outline" size={18} color="#00d4ff" />
                  <Text style={s.activeTitle}>АКТИВНЫЕ ({indActive.length}/4)</Text>
                </View>
                {indActive.map(a => {
                  const pid = a.type?.split('_')[1];
                  const player = players.find(p => String(p.id) === String(pid));
                  return (
                    <View key={a.id} style={s.indRow}>
                      {player && <PlayerAvatar player={player} size={32} showPos={false} />}
                      <View style={{ flex: 1 }}>
                        <Text style={s.indName}>{player ? `${player.name} ${player.surname}` : 'Игрок'}</Text>
                        <View style={s.activeRow}>
                          <Ionicons name={FOCUS_ICONS[a.focus] || 'fitness-outline'} size={12} color="#00d4ff" />
                          <Text style={s.activeTime}>{FOCUS_LABELS[a.focus] || a.focus}</Text>
                        </View>
                      </View>
                      <View style={s.activeRow}>
                        <Ionicons name={a.completed ? 'checkmark-circle-outline' : 'hourglass-outline'} size={16} color={a.completed ? '#00ff88' : '#8888aa'} />
                        <Text style={s.activeTime}>{a.completed ? '✓' : formatTime(a.hours_left)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={s.sectionTitle}>ТРЕНЕРЫ ПО ЛИНИЯМ · 3 ДНЯ</Text>
            <Text style={s.sectionHint}>Каждый тренер работает со слабейшим игроком своей линии. Молодые (до 23) растут быстрее x1.5.</Text>

            {indActive.length < 4 && (
              <TouchableOpacity
                style={[s.autoBtn, loading && s.trainingCardDisabled]}
                disabled={loading}
                onPress={assignIndividual}
              >
                <View style={[s.trainingIcon, { backgroundColor: '#7b2fff20' }]}>
                  <Ionicons name="people-outline" size={28} color="#7b2fff" />
                </View>
                <View style={s.trainingInfo}>
                  <Text style={[s.trainingLabel, { color: '#7b2fff' }]}>НАЗНАЧИТЬ ТРЕНИРОВКИ</Text>
                  <Text style={s.trainingDesc}>Помощник подберёт план для каждой линии</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8888aa" />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:               { flex: 1, backgroundColor: '#0a0a0f' },
  header:               { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  title:                { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:                  { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  msgBanner:            { marginHorizontal: 16, borderRadius: 8, padding: 10, marginBottom: 4 },
  msgText:              { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  tabs:                 { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:                  { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:            { backgroundColor: '#00d4ff' },
  tabText:              { fontSize: 11, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  tabTextActive:        { color: '#000' },
  content:              { padding: 16, gap: 10 },
  activeCard:           { backgroundColor: '#00d4ff15', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#00d4ff30', gap: 8 },
  activeHeader:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeTitle:          { fontSize: 11, color: '#00d4ff', fontWeight: '900', letterSpacing: 2 },
  activeRow:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeFocus:          { fontSize: 16, fontWeight: '900', color: '#fff' },
  activeTime:           { fontSize: 12, color: '#8888aa' },
  indRow:               { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#ffffff10' },
  indName:              { fontSize: 12, fontWeight: '700', color: '#fff' },
  sectionTitle:         { fontSize: 11, color: '#8888aa', letterSpacing: 2 },
  sectionHint:          { fontSize: 12, color: '#8888aa', lineHeight: 18 },
  trainingCard:         { backgroundColor: '#12121a', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#ffffff10' },
  trainingCardActive:   { borderColor: '#00ff8840', backgroundColor: '#00ff8810' },
  trainingCardDisabled: { opacity: 0.4 },
  trainingIcon:         { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trainingInfo:         { flex: 1 },
  trainingLabel:        { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  trainingDesc:         { fontSize: 11, color: '#8888aa', marginTop: 3 },
  autoBtn:              { backgroundColor: '#7b2fff20', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#7b2fff40' },
});
