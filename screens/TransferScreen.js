import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { loadManagerData, loadSession, saveManagerData } from '../utils/storage';
import { api } from '../utils/api';

const POSITIONS = ['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const POS_COLORS = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981', LM: '#10b981', RM: '#10b981',
  LW: '#ef4444', RW: '#ef4444', ST: '#ef4444',
};

export default function TransferScreen() {
  const [tab, setTab] = useState('market');
  const [players, setPlayers] = useState([]);
  const [myPlayers, setMyPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [club, setClub] = useState(null);
  const [token, setToken] = useState(null);
  const [managerName, setManagerName] = useState(null);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { token } = await loadSession();
    const { club, managerName } = await loadManagerData();
    setToken(token);
    setClub(club);
    setManagerName(managerName);
    loadMarket('ALL', club);
    if (club) {
      const p = await api.getPlayers(club.id);
      setMyPlayers(p);
    }
  };

  const refreshClub = async () => {
    if (!token) return;
    const user = await api.getMe(token);
    if (user && user.club) {
      setClub(user.club);
      await saveManagerData(user.club, managerName);
    }
  };

  const loadMarket = async (pos = 'ALL', currentClub = club) => {
    setLoading(true);
    try {
      const params = {};
      if (pos && pos !== 'ALL') params.position = pos;
      const data = await api.getMarket(params);
      setPlayers(data.filter(p => p.club_id !== Number(currentClub?.id)));
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleFilterChange = (pos) => {
    setFilter(pos);
    loadMarket(pos);
  };

  const showMsg = (text, type = 'success') => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBuy = async () => {
    if (!selected || !token) return;
    const res = await api.buyPlayer(token, selected.id);
    if (res.success) {
      showMsg(res.message, 'success');
      setSelected(null);
      await refreshClub();
      loadMarket(filter);
      const p = await api.getPlayers(club.id);
      setMyPlayers(p);
    } else {
      showMsg(res.detail || 'Ошибка', 'error');
      setSelected(null);
    }
  };

  const handleSell = async (player) => {
    if (!token) return;
    const res = await api.sellPlayer(token, player.id);
    if (res.success) {
      showMsg(res.message, 'success');
      await refreshClub();
      const p = await api.getPlayers(club.id);
      setMyPlayers(p);
    } else {
      showMsg(res.detail || 'Ошибка', 'error');
    }
  };

  const renderMarketPlayer = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
      <View style={[s.posTag, { backgroundColor: POS_COLORS[item.position] || '#666' }]}>
        <Text style={s.posText}>{item.position}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{item.name} {item.surname}</Text>
        <Text style={s.clubName}>{item.club_name}</Text>
        <Text style={s.detail}>{item.nationality} · {item.age} лет</Text>
      </View>
      <View style={s.right}>
        <Text style={s.ovr}>{item.overall}</Text>
        <Text style={s.price}>£{item.value}M</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMyPlayer = ({ item }) => (
    <View style={s.card}>
      <View style={[s.posTag, { backgroundColor: POS_COLORS[item.position] || '#666' }]}>
        <Text style={s.posText}>{item.position}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{item.name} {item.surname}</Text>
        <Text style={s.detail}>{item.nationality} · {item.age} лет</Text>
        <Text style={s.salary}>£{item.salary}k/нед · до {item.contract}</Text>
      </View>
      <View style={s.right}>
        <Text style={s.ovr}>{item.overall}</Text>
        <TouchableOpacity style={s.sellBtn} onPress={() => handleSell(item)}>
          <Text style={s.sellBtnText}>ПРОДАТЬ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ТРАНСФЕРЫ</Text>
        <Text style={s.sub}>БЮДЖЕТ: £{club?.budget?.toFixed(1) || 0}M</Text>
      </View>

      {message ? (
        <View style={[s.messageBanner, { backgroundColor: msgType === 'success' ? '#00ff8820' : '#ff335520' }]}>
          <Text style={[s.messageText, { color: msgType === 'success' ? '#00ff88' : '#ff3355' }]}>{message}</Text>
        </View>
      ) : null}

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'market' && s.tabActive]} onPress={() => setTab('market')}>
          <Text style={[s.tabText, tab === 'market' && s.tabTextActive]}>РЫНОК</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'squad' && s.tabActive]} onPress={() => setTab('squad')}>
          <Text style={[s.tabText, tab === 'squad' && s.tabTextActive]}>МОИ ИГРОКИ</Text>
        </TouchableOpacity>
      </View>

      {tab === 'market' && (
        <View style={s.filtersWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {POSITIONS.map(pos => (
              <TouchableOpacity key={pos} style={[s.filterBtn, filter === pos && s.filterActive]} onPress={() => handleFilterChange(pos)}>
                <Text style={[s.filterText, filter === pos && s.filterTextActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={s.loader}><ActivityIndicator size="large" color="#00d4ff" /></View>
      ) : (
        <FlatList
          data={tab === 'market' ? players : myPlayers}
          keyExtractor={i => String(i.id)}
          renderItem={tab === 'market' ? renderMarketPlayer : renderMyPlayer}
          contentContainerStyle={s.list}
        />
      )}

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.posTagLg, { backgroundColor: POS_COLORS[selected?.position] || '#666' }]}>
              <Text style={s.posTextLg}>{selected?.position}</Text>
            </View>
            <Text style={s.modalName}>{selected?.name} {selected?.surname}</Text>
            <Text style={s.modalClub}>{selected?.club_name} · {selected?.nationality}</Text>

            <View style={s.modalStats}>
              {[
                { label: 'РЕЙТИНГ',   value: selected?.overall,   color: '#ffd700' },
                { label: 'ПОТЕНЦИАЛ', value: selected?.potential,  color: '#00ff88' },
                { label: 'ВОЗРАСТ',   value: selected?.age,        color: '#00d4ff' },
                { label: 'КОНТРАКТ',  value: selected?.contract,   color: '#8888aa' },
              ].map(item => (
                <View key={item.label} style={s.modalStat}>
                  <Text style={[s.modalStatVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={s.modalStatLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={s.divider} />
            <View style={s.priceRow}>
              <View style={s.priceBox}>
                <Text style={s.priceVal}>£{selected?.value}M</Text>
                <Text style={s.priceLabel}>СТОИМОСТЬ</Text>
              </View>
              <View style={s.priceBox}>
                <Text style={s.priceVal}>£{selected?.salary}k</Text>
                <Text style={s.priceLabel}>ЗАРПЛАТА/НЕД</Text>
              </View>
              <View style={s.priceBox}>
                <Text style={[s.priceVal, { color: (club?.budget || 0) >= (selected?.value || 0) ? '#00ff88' : '#ff3355' }]}>
                  £{club?.budget?.toFixed(1)}M
                </Text>
                <Text style={s.priceLabel}>ВАШ БЮДЖЕТ</Text>
              </View>
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnDecline} onPress={() => setSelected(null)}>
                <Text style={s.btnDeclineText}>ОТМЕНА</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnBuy, (club?.budget || 0) < (selected?.value || 0) && s.btnDisabled]}
                disabled={(club?.budget || 0) < (selected?.value || 0)}
                onPress={handleBuy}
              >
                <Text style={s.btnBuyText}>КУПИТЬ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: '#0a0a0f' },
  header:         { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  title:          { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:            { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  messageBanner:  { marginHorizontal: 16, borderRadius: 8, padding: 10, marginBottom: 4 },
  messageText:    { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  tabs:           { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:            { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:      { backgroundColor: '#00d4ff' },
  tabText:        { fontSize: 12, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  tabTextActive:  { color: '#000' },
  filtersWrap:    { height: 44, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  filters:        { paddingHorizontal: 16, gap: 6, alignItems: 'center', height: 44 },
  filterBtn:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15' },
  filterActive:   { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  filterText:     { fontSize: 10, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  filterTextActive:{ color: '#000' },
  loader:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:           { padding: 12, gap: 8 },
  card:           { backgroundColor: '#12121a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ffffff10' },
  posTag:         { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  posText:        { fontSize: 8, fontWeight: '900', color: '#fff' },
  info:           { flex: 1 },
  name:           { fontSize: 13, fontWeight: '800', color: '#fff' },
  clubName:       { fontSize: 10, color: '#00d4ff', marginTop: 1 },
  detail:         { fontSize: 10, color: '#8888aa', marginTop: 1 },
  salary:         { fontSize: 10, color: '#8888aa', marginTop: 1 },
  right:          { alignItems: 'flex-end', gap: 4 },
  ovr:            { fontSize: 18, fontWeight: '900', color: '#ffd700' },
  price:          { fontSize: 11, color: '#00ff88', fontWeight: '700' },
  sellBtn:        { backgroundColor: '#ff335520', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#ff3355' },
  sellBtnText:    { fontSize: 9, fontWeight: '900', color: '#ff3355', letterSpacing: 1 },
  overlay:        { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  modal:          { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#ffffff15' },
  posTagLg:       { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  posTextLg:      { fontSize: 12, fontWeight: '900', color: '#fff' },
  modalName:      { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' },
  modalClub:      { fontSize: 11, color: '#8888aa', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  modalStats:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modalStat:      { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, padding: 10, alignItems: 'center' },
  modalStatVal:   { fontSize: 16, fontWeight: '900' },
  modalStatLabel: { fontSize: 8, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  divider:        { height: 1, backgroundColor: '#ffffff10', marginBottom: 16 },
  priceRow:       { flexDirection: 'row', gap: 8, marginBottom: 20 },
  priceBox:       { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, padding: 10, alignItems: 'center' },
  priceVal:       { fontSize: 14, fontWeight: '900', color: '#fff' },
  priceLabel:     { fontSize: 8, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  modalBtns:      { flexDirection: 'row', gap: 12 },
  btnDecline:     { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff20', alignItems: 'center' },
  btnDeclineText: { color: '#8888aa', fontWeight: '700', letterSpacing: 1 },
  btnBuy:         { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#00d4ff', alignItems: 'center' },
  btnDisabled:    { opacity: 0.4 },
  btnBuyText:     { color: '#000', fontWeight: '900', letterSpacing: 2 },
});
