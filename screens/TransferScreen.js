import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlayerAvatar from '../components/PlayerAvatar';
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
  const [listedPlayers, setListedPlayers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [myPlayers, setMyPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [sellSelected, setSellSelected] = useState(null);
  const [club, setClub] = useState(null);
  const [managerName, setManagerName] = useState(null);
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [offerAmount, setOfferAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [showFreeAgents, setShowFreeAgents] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { token } = await loadSession();
    const { club, managerName } = await loadManagerData();
    setToken(token);
    setClub(club);
    setManagerName(managerName);
    loadMarket('ALL', false, club);
    if (club) {
      const p = await api.getPlayers(club.id);
      setMyPlayers(p.filter(pl => !pl.transfer_listed));
      setListedPlayers(p.filter(pl => pl.transfer_listed));
    }
    if (token) {
      try {
        const o = await api.getTransferOffers(token);
        setOffers(o || []);
      } catch(e) {}
    }
  };

  const refreshClub = async () => {
    if (!token) return;
    const user = await api.getMe(token);
    if (user?.club) {
      setClub(user.club);
      await saveManagerData(user.club, managerName);
    }
  };

  const loadMarket = async (pos = 'ALL', freeAgents = false, currentClub = club) => {
    setLoading(true);
    try {
      const params = {};
      if (pos && pos !== 'ALL') params.position = pos;
      if (freeAgents) params.free_agents = true;
      const data = await api.getMarket(params);
      setPlayers(data.filter(p => p.club_id !== Number(currentClub?.id)));
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleFilterChange = (pos) => {
    setFilter(pos);
    loadMarket(pos, showFreeAgents);
  };

  const toggleFreeAgents = () => {
    const next = !showFreeAgents;
    setShowFreeAgents(next);
    loadMarket(filter, next);
  };

  const showMsg = (text, type = 'success') => {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleBuy = async () => {
    if (!selected || !token) return;
    const offer = parseFloat(offerAmount);
    if (isNaN(offer) || offer <= 0) {
      showMsg('Введи сумму предложения', 'error');
      return;
    }
    const res = await api.buyPlayerOffer(token, selected.id, offer);
    if (res.success) {
      showMsg(res.message, 'success');
      setSelected(null);
      await refreshClub();
      loadMarket(filter, showFreeAgents);
      const p = await api.getPlayers(club.id);
      setMyPlayers(p);
    } else {
      showMsg(res.detail || 'Ошибка', 'error');
    }
  };

  const handleList = async () => {
    if (!sellSelected || !token) return;
    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) {
      showMsg('Введи цену продажи', 'error');
      return;
    }
    const playerId = sellSelected.id;
    setSellSelected(null);
    const res = await api.listPlayer(token, playerId, price);
    if (res.success) {
      showMsg(res.message, 'success');
      const p = await api.getPlayers(club.id);
      setMyPlayers(p);
    } else {
      showMsg(res.detail || 'Ошибка', 'error');
    }
  };

  const renderMarketPlayer = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => { setSelected(item); setOfferAmount(String(item.value)); }}>
      <PlayerAvatar player={item} size={44} />
      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name}>{item.name} {item.surname}</Text>
          {item.is_free_agent && <View style={s.freeBadge}><Text style={s.freeText}>FREE</Text></View>}
          {item.transfer_request && <View style={s.requestBadge}><Text style={s.requestText}>ХОЧЕТ УЙТИ</Text></View>}
        </View>
        <Text style={s.clubName}>{item.club_name}</Text>
        <Text style={s.detail}>{item.nationality} · {item.age} лет</Text>
      </View>
      <View style={s.right}>
        <Text style={s.ovr}>{item.overall}</Text>
        <Text style={s.price}>{item.is_free_agent ? 'FREE' : `£${item.value}M`}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMyPlayer = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => { setSellSelected(item); setSellPrice(String(item.value)); }}>
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
        <Text style={s.price}>£{item.value}M</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ТРАНСФЕРЫ</Text>
        <Text style={s.sub}>БЮДЖЕТ: £{club?.budget?.toFixed(1) || 0}M</Text>
      </View>

      {/* Уведомление поверх всего */}
      <Modal visible={!!message} transparent animationType="fade">
        <View style={s.notifOverlay}>
          <View style={[s.notifBox, { borderColor: msgType === 'success' ? '#00ff88' : '#ff3355' }]}>
            <Text style={s.notifIcon}>{msgType === 'success' ? '✅' : '❌'}</Text>
            <Text style={[s.notifText, { color: msgType === 'success' ? '#00ff88' : '#ff3355' }]}>{message}</Text>
          </View>
        </View>
      </Modal>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'market' && s.tabActive]} onPress={() => setTab('market')}>
          <Text style={[s.tabText, tab === 'market' && s.tabTextActive]}>РЫНОК</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'listed' && s.tabActive]} onPress={() => setTab('listed')}>
          <Text style={[s.tabText, tab === 'listed' && s.tabTextActive]}>
            ПРОДАЖА{listedPlayers.length > 0 ? ` (${listedPlayers.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'offers' && s.tabActive]} onPress={() => setTab('offers')}>
          <Text style={[s.tabText, tab === 'offers' && s.tabTextActive]}>
            ПРЕДЛОЖЕНИЯ{offers.length > 0 ? ` (${offers.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'market' && (
        <View style={s.filtersWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            <TouchableOpacity
              style={[s.filterBtn, showFreeAgents && s.filterFree]}
              onPress={toggleFreeAgents}
            >
              <Text style={[s.filterText, showFreeAgents && { color: '#00ff88' }]}>FREE</Text>
            </TouchableOpacity>
            {POSITIONS.map(pos => (
              <TouchableOpacity
                key={pos}
                style={[s.filterBtn, filter === pos && s.filterActive]}
                onPress={() => handleFilterChange(pos)}
              >
                <Text style={[s.filterText, filter === pos && s.filterTextActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {tab === 'listed' && (
        <FlatList
          data={listedPlayers}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={s.list}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Нет выставленных игроков</Text></View>}
          renderItem={({ item }) => (
            <View style={[s.card, { borderColor: '#ff6b3540' }]}>
              <PlayerAvatar player={item} size={44} />
              <View style={s.info}>
                <Text style={s.name}>{item.name} {item.surname}</Text>
                <Text style={s.detail}>{item.nationality} · {item.age} лет</Text>
                <Text style={[s.salary, { color: '#ff6b35' }]}>Выставлен за £{item.asking_price || item.value}M</Text>
              </View>
              <View style={s.right}>
                <Text style={s.ovr}>{item.overall}</Text>
                <Text style={s.price}>⏳ ЖДЁМ</Text>
              </View>
            </View>
          )}
        />
      )}

      {tab === 'offers' && (
        <FlatList
          data={offers}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={s.list}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyText}>Нет входящих предложений</Text></View>}
          renderItem={({ item }) => (
            <View style={[s.card, { borderColor: '#00d4ff40' }]}>
              <PlayerAvatar player={item} size={44} />
              <View style={s.info}>
                <Text style={s.name}>{item.name} {item.surname}</Text>
                <Text style={s.clubName}>{item.from_club_name}</Text>
                <Text style={[s.salary, { color: '#00d4ff' }]}>Предложение: £{item.offer_price}M</Text>
              </View>
              <View style={s.right}>
                <TouchableOpacity style={s.acceptBtn} onPress={async () => {
                  const res = await api.respondOffer(token, item.id, true);
                  showMsg(res.message || res.detail, res.success ? 'success' : 'error');
                  const o = await api.getTransferOffers(token);
                  setOffers(o || []);
                  const p = await api.getPlayers(club.id);
                  setMyPlayers(p.filter(pl => !pl.transfer_listed));
                  setListedPlayers(p.filter(pl => pl.transfer_listed));
                  await refreshClub();
                }}>
                  <Text style={s.acceptText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={async () => {
                  const res = await api.respondOffer(token, item.id, false);
                  showMsg(res.message || res.detail, 'success');
                  const o = await api.getTransferOffers(token);
                  setOffers(o || []);
                }}>
                  <Text style={s.rejectText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {loading ? (
        <View style={s.loader}><ActivityIndicator size="large" color="#00d4ff" /></View>
      ) : tab === 'market' ? (
        <FlatList
          data={players}
          keyExtractor={i => String(i.id)}
          renderItem={renderMarketPlayer}
          contentContainerStyle={s.list}
        />
      ) : null}

      {/* Модалка покупки */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={{ alignSelf: 'center', marginBottom: 8 }}>
              {selected && <PlayerAvatar player={selected} size={80} showPos={false} />}
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

            {selected?.is_free_agent ? (
              <View style={s.freeAgentBox}>
                <Text style={s.freeAgentTitle}>🆓 СВОБОДНЫЙ АГЕНТ</Text>
                <Text style={s.freeAgentText}>Можно подписать в любое время без трансферной платы</Text>
                <Text style={s.freeAgentSalary}>Зарплата: £{selected?.salary}k/нед</Text>
              </View>
            ) : (
              <View style={s.offerBox}>
                <Text style={s.offerLabel}>СУММА ПРЕДЛОЖЕНИЯ (млн £)</Text>
                <View style={s.offerRow}>
                  <TouchableOpacity
                    style={s.offerMinus}
                    onPress={() => setOfferAmount(v => String(Math.max(0.1, (parseFloat(v) || 0) - 0.5).toFixed(1)))}
                  >
                    <Text style={s.offerMinusText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={s.offerInput}
                    value={offerAmount}
                    onChangeText={setOfferAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#8888aa"
                  />
                  <TouchableOpacity
                    style={s.offerPlus}
                    onPress={() => setOfferAmount(v => String(((parseFloat(v) || 0) + 0.5).toFixed(1)))}
                  >
                    <Text style={s.offerPlusText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.offerHint}>
                  Рын. стоимость: £{selected?.value}M · Ваш бюджет: £{club?.budget?.toFixed(1)}M
                </Text>
              </View>
            )}

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnDecline} onPress={() => setSelected(null)}>
                <Text style={s.btnDeclineText}>ОТМЕНА</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnBuy} onPress={handleBuy}>
                <Text style={s.btnBuyText}>
                  {selected?.is_free_agent ? 'ПОДПИСАТЬ' : 'СДЕЛАТЬ ПРЕДЛОЖЕНИЕ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Модалка продажи */}
      <Modal visible={!!sellSelected} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.posTagLg, { backgroundColor: POS_COLORS[sellSelected?.position] || '#666' }]}>
              <Text style={s.posTextLg}>{sellSelected?.position}</Text>
            </View>
            <Text style={s.modalName}>{sellSelected?.name} {sellSelected?.surname}</Text>
            <Text style={s.modalClub}>{sellSelected?.nationality} · {sellSelected?.age} лет</Text>

            <View style={s.divider} />

            <View style={s.offerBox}>
              <Text style={s.offerLabel}>ЦЕНА ПРОДАЖИ (млн £)</Text>
              <View style={s.offerRow}>
                <TouchableOpacity
                  style={s.offerMinus}
                  onPress={() => setSellPrice(v => String(Math.max(0.1, (parseFloat(v) || 0) - 0.5).toFixed(1)))}
                >
                  <Text style={s.offerMinusText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={s.offerInput}
                  value={sellPrice}
                  onChangeText={setSellPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#8888aa"
                />
                <TouchableOpacity
                  style={s.offerPlus}
                  onPress={() => setSellPrice(v => String(((parseFloat(v) || 0) + 0.5).toFixed(1)))}
                >
                  <Text style={s.offerPlusText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.offerHint}>Рын. стоимость: £{sellSelected?.value}M</Text>
              <Text style={s.offerHint2}>⏳ Боты сделают предложение в течение нескольких дней</Text>
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnDecline} onPress={() => setSellSelected(null)}>
                <Text style={s.btnDeclineText}>ОТМЕНА</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnBuy, { backgroundColor: '#ff6b35' }]} onPress={handleList}>
                <Text style={s.btnBuyText}>ВЫСТАВИТЬ НА ПРОДАЖУ</Text>
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
  header:          { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  title:           { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:             { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  messageBanner:   { marginHorizontal: 16, borderRadius: 8, padding: 10, marginBottom: 4 },
  notifOverlay:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000066' },
  notifBox:        { backgroundColor: '#12121a', borderRadius: 16, padding: 20, marginHorizontal: 32, alignItems: 'center', borderWidth: 1.5, gap: 10 },
  notifIcon:       { fontSize: 36 },
  notifText:       { fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  messageText:     { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  tabs:            { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:             { flex: 1, padding: 10, alignItems: 'center', borderRadius: 10 },
  tabActive:       { backgroundColor: '#00d4ff' },
  tabText:         { fontSize: 12, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  tabTextActive:   { color: '#000' },
  filtersWrap:     { height: 44, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  filters:         { paddingHorizontal: 16, gap: 6, alignItems: 'center', height: 44 },
  filterBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15' },
  filterActive:    { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  filterFree:      { backgroundColor: '#00ff8820', borderColor: '#00ff88' },
  filterText:      { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  filterTextActive:{ color: '#000' },
  loader:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:           { padding: 40, alignItems: 'center' },
  emptyText:       { color: '#8888aa', fontSize: 13 },
  acceptBtn:       { backgroundColor: '#00ff8820', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00ff88' },
  acceptText:      { color: '#00ff88', fontWeight: '900', fontSize: 16 },
  rejectBtn:       { backgroundColor: '#ff335520', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ff3355', marginTop: 6 },
  rejectText:      { color: '#ff3355', fontWeight: '900', fontSize: 14 },
  list:            { padding: 12, gap: 8 },
  card:            { backgroundColor: '#12121a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#ffffff10' },
  posTag:          { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  playerAvatar:    { position: 'relative', width: 44, height: 44 },
  avatarInner:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  posMini:         { position: 'absolute', bottom: -4, right: -4, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 },
  posMiniText:     { fontSize: 7, fontWeight: '900', color: '#fff' },
  posText:         { fontSize: 8, fontWeight: '900', color: '#fff' },
  info:            { flex: 1 },
  nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name:            { fontSize: 13, fontWeight: '800', color: '#fff' },
  freeBadge:       { backgroundColor: '#00ff8820', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: '#00ff88' },
  freeText:        { fontSize: 8, color: '#00ff88', fontWeight: '900' },
  requestBadge:    { backgroundColor: '#ff6b3520', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1, borderColor: '#ff6b35' },
  requestText:     { fontSize: 8, color: '#ff6b35', fontWeight: '900' },
  clubName:        { fontSize: 10, color: '#00d4ff', marginTop: 1 },
  detail:          { fontSize: 10, color: '#8888aa', marginTop: 1 },
  salary:          { fontSize: 10, color: '#8888aa', marginTop: 1 },
  right:           { alignItems: 'flex-end', gap: 4 },
  ovr:             { fontSize: 18, fontWeight: '900', color: '#ffd700' },
  price:           { fontSize: 11, color: '#00ff88', fontWeight: '700' },
  overlay:         { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  modal:           { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#ffffff15' },
  posTagLg:        { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  posTextLg:       { fontSize: 12, fontWeight: '900', color: '#fff' },
  modalName:       { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' },
  modalClub:       { fontSize: 11, color: '#8888aa', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  modalStats:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modalStat:       { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, padding: 10, alignItems: 'center' },
  modalStatVal:    { fontSize: 16, fontWeight: '900' },
  modalStatLabel:  { fontSize: 8, color: '#8888aa', letterSpacing: 1, marginTop: 2 },
  divider:         { height: 1, backgroundColor: '#ffffff10', marginBottom: 16 },
  offerBox:        { marginBottom: 16 },
  offerLabel:      { fontSize: 10, color: '#8888aa', letterSpacing: 2, marginBottom: 8 },
  offerRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  offerMinus:      { width: 40, height: 40, backgroundColor: '#0a0a0f', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  offerMinusText:  { fontSize: 22, color: '#ff3355', fontWeight: '900' },
  offerInput:      { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, padding: 12, fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  offerPlus:       { width: 40, height: 40, backgroundColor: '#0a0a0f', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  offerPlusText:   { fontSize: 22, color: '#00ff88', fontWeight: '900' },
  offerHint:       { fontSize: 11, color: '#8888aa', textAlign: 'center' },
  offerHint2:      { fontSize: 11, color: '#8888aa', textAlign: 'center', marginTop: 4 },
  freeAgentBox:    { backgroundColor: '#00ff8810', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#00ff8830' },
  freeAgentTitle:  { fontSize: 16, fontWeight: '900', color: '#00ff88', marginBottom: 6 },
  freeAgentText:   { fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 18 },
  freeAgentSalary: { fontSize: 13, color: '#fff', fontWeight: '700', marginTop: 8 },
  modalBtns:       { flexDirection: 'row', gap: 12 },
  btnDecline:      { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff20', alignItems: 'center' },
  btnDeclineText:  { color: '#8888aa', fontWeight: '700', letterSpacing: 1 },
  btnBuy:          { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#00d4ff', alignItems: 'center' },
  btnBuyText:      { color: '#000', fontWeight: '900', letterSpacing: 1, fontSize: 11 },
});
