import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, TextInput } from 'react-native';
import { loadManagerData, loadSession } from '../utils/storage';
import { api } from '../utils/api';
import PlayerCard from '../components/PlayerCard';

const POSITIONS = ['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const POS_COLORS = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981', LM: '#10b981', RM: '#10b981',
  LW: '#ef4444', RW: '#ef4444', ST: '#ef4444',
};

const getContractColor = (year) => {
  if (year <= 2025) return '#ff3355';
  if (year <= 2026) return '#ffd700';
  return '#00ff88';
};

const getContractLabel = (year) => {
  if (year <= 2025) return '⚠️ ИСТЕКАЕТ';
  if (year <= 2026) return '⏳ СКОРО';
  return '✓ OK';
};

export default function SquadScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('squad');
  const [token, setToken] = useState(null);
  const [club, setClub] = useState(null);
  const [sellPlayer, setSellPlayer] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { token } = await loadSession();
    const { club } = await loadManagerData();
    setToken(token);
    setClub(club);
    if (club) {
      const data = await api.getPlayers(club.id);
      setPlayers(data);
    }
    setLoading(false);
  };

  const showMsg = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleList = async () => {
    if (!sellPlayer || !token) return;
    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) return;
    const playerId = sellPlayer.id;
    setSellPlayer(null);
    const res = await api.listPlayer(token, playerId, price);
    showMsg(res.message || res.detail);
    const data = await api.getPlayers(club.id);
    setPlayers(data);
  };

  const filtered = filter === 'ALL' ? players : players.filter(p => p.position === filter);
  const contractSorted = [...players].sort((a, b) => a.contract - b.contract);

  const renderPlayer = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
      <View style={[s.posTag, { backgroundColor: POS_COLORS[item.position] || '#666' }]}>
        <Text style={s.posText}>{item.position}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{item.name} {item.surname}</Text>
        <Text style={s.detail}>{item.nationality} · {item.age} лет</Text>
        {item.transfer_listed && <Text style={s.listedTag}>📤 ВЫСТАВЛЕН</Text>}
      </View>
      <View style={s.right}>
        <Text style={s.ovr}>{item.overall}</Text>
        <Text style={s.pot}>↑{item.potential}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderContract = ({ item }) => {
    const color = getContractColor(item.contract);
    const label = getContractLabel(item.contract);
    return (
      <View style={[s.contractCard, { borderLeftColor: color }]}>
        <View style={[s.posTag, { backgroundColor: POS_COLORS[item.position] || '#666' }]}>
          <Text style={s.posText}>{item.position}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name}>{item.name} {item.surname}</Text>
          <Text style={s.detail}>До {item.contract} · £{item.salary}k/нед</Text>
          {item.transfer_listed && <Text style={s.listedTag}>📤 ВЫСТАВЛЕН</Text>}
        </View>
        <View style={s.contractRight}>
          <Text style={[s.contractLabel, { color }]}>{label}</Text>
          {!item.transfer_listed && (
            <TouchableOpacity
              style={s.sellBtn}
              onPress={() => { setSellPlayer(item); setSellPrice(String(item.value)); }}
            >
              <Text style={s.sellBtnText}>ПРОДАТЬ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>СОСТАВ</Text>
        <Text style={s.sub}>{players.length} ИГРОКОВ</Text>
      </View>

      {message ? (
        <View style={s.msgBanner}>
          <Text style={s.msgText}>{message}</Text>
        </View>
      ) : null}

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'squad' && s.tabActive]} onPress={() => setTab('squad')}>
          <Text style={[s.tabText, tab === 'squad' && s.tabTextActive]}>ИГРОКИ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'contracts' && s.tabActive]} onPress={() => setTab('contracts')}>
          <Text style={[s.tabText, tab === 'contracts' && s.tabTextActive]}>КОНТРАКТЫ</Text>
        </TouchableOpacity>
      </View>

      {tab === 'squad' && (
        <View style={s.filtersWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {POSITIONS.map(pos => (
              <TouchableOpacity
                key={pos}
                style={[s.filterBtn, filter === pos && s.filterActive]}
                onPress={() => setFilter(pos)}
              >
                <Text style={[s.filterText, filter === pos && s.filterTextActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={s.loader}><ActivityIndicator size="large" color="#00d4ff" /></View>
      ) : tab === 'squad' ? (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderPlayer}
          contentContainerStyle={s.list}
        />
      ) : (
        <FlatList
          data={contractSorted}
          keyExtractor={i => String(i.id)}
          renderItem={renderContract}
          contentContainerStyle={s.list}
        />
      )}

      {selected && (
        <PlayerCard player={selected} onClose={() => setSelected(null)} />
      )}

      <Modal visible={!!sellPlayer} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>ВЫСТАВИТЬ НА ПРОДАЖУ</Text>
            <Text style={s.modalName}>{sellPlayer?.name} {sellPlayer?.surname}</Text>
            <Text style={s.modalSub}>Рын. стоимость: £{sellPlayer?.value}M</Text>
            <View style={s.offerRow}>
              <TouchableOpacity style={s.offerMinus} onPress={() => setSellPrice(v => String(Math.max(0.1, (parseFloat(v)||0) - 0.5).toFixed(1)))}>
                <Text style={s.offerMinusText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={s.offerInput}
                value={sellPrice}
                onChangeText={setSellPrice}
                keyboardType="numeric"
                placeholderTextColor="#8888aa"
              />
              <TouchableOpacity style={s.offerPlus} onPress={() => setSellPrice(v => String(((parseFloat(v)||0) + 0.5).toFixed(1)))}>
                <Text style={s.offerPlusText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.offerHint}>⏳ Боты сделают предложение в течение нескольких дней</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnDecline} onPress={() => setSellPlayer(null)}>
                <Text style={s.btnDeclineText}>ОТМЕНА</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSell} onPress={handleList}>
                <Text style={s.btnSellText}>ВЫСТАВИТЬ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#0a0a0f' },
  header:          { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:           { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:             { fontSize: 11, color: '#00d4ff', letterSpacing: 2 },
  msgBanner:       { backgroundColor: '#00ff8820', marginHorizontal: 16, borderRadius: 8, padding: 10, marginBottom: 4 },
  msgText:         { color: '#00ff88', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  tabs:            { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:             { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:       { backgroundColor: '#00d4ff' },
  tabText:         { fontSize: 12, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  tabTextActive:   { color: '#000' },
  filtersWrap:     { height: 44, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  filters:         { paddingHorizontal: 16, gap: 6, alignItems: 'center', height: 44 },
  filterBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15' },
  filterActive:    { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  filterText:      { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  filterTextActive:{ color: '#000' },
  loader:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:            { padding: 12, gap: 8 },
  card:            { backgroundColor: '#12121a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ffffff10' },
  posTag:          { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  posText:         { fontSize: 8, fontWeight: '900', color: '#fff' },
  info:            { flex: 1 },
  name:            { fontSize: 13, fontWeight: '800', color: '#fff' },
  detail:          { fontSize: 10, color: '#8888aa', marginTop: 2 },
  listedTag:       { fontSize: 9, color: '#ff6b35', marginTop: 2, fontWeight: '700' },
  right:           { alignItems: 'flex-end' },
  ovr:             { fontSize: 18, fontWeight: '900', color: '#ffd700' },
  pot:             { fontSize: 11, color: '#00ff88', marginTop: 2 },
  contractCard:    { backgroundColor: '#12121a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ffffff10', borderLeftWidth: 3 },
  contractRight:   { alignItems: 'flex-end', gap: 6 },
  contractLabel:   { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sellBtn:         { backgroundColor: '#ff335520', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#ff3355' },
  sellBtnText:     { fontSize: 9, color: '#ff3355', fontWeight: '900', letterSpacing: 1 },
  overlay:         { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  modal:           { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#ffffff15' },
  modalTitle:      { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  modalName:       { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  modalSub:        { fontSize: 12, color: '#8888aa', textAlign: 'center', marginBottom: 16, marginTop: 4 },
  offerRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  offerMinus:      { width: 44, height: 44, backgroundColor: '#0a0a0f', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  offerMinusText:  { fontSize: 24, color: '#ff3355', fontWeight: '900' },
  offerInput:      { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, padding: 12, fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  offerPlus:       { width: 44, height: 44, backgroundColor: '#0a0a0f', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  offerPlusText:   { fontSize: 24, color: '#00ff88', fontWeight: '900' },
  offerHint:       { fontSize: 11, color: '#8888aa', textAlign: 'center', marginBottom: 20 },
  modalBtns:       { flexDirection: 'row', gap: 12 },
  btnDecline:      { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff20', alignItems: 'center' },
  btnDeclineText:  { color: '#8888aa', fontWeight: '700', letterSpacing: 1 },
  btnSell:         { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#ff6b35', alignItems: 'center' },
  btnSellText:     { color: '#fff', fontWeight: '900', letterSpacing: 2 },
});
