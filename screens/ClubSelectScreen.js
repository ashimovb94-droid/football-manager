import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { CHAMPIONSHIP_CLUBS, EPL_CLUBS } from '../data/clubs';
import { setManagerData } from './HomeScreen';
import ClubBadge from '../components/ClubBadge';

const MANAGER_RATING = 50;

export default function ClubSelectScreen({ navigation, route }) {
  const { managerName } = route.params;
  const [tab, setTab] = useState('championship');
  const [selected, setSelected] = useState(null);

  const clubs = tab === 'championship' ? CHAMPIONSHIP_CLUBS : EPL_CLUBS;

  const handlePress = (club) => {
    if (tab === 'epl' && MANAGER_RATING < club.minRating) {
      setSelected({ ...club, locked: true });
    } else {
      setSelected({ ...club, locked: false });
    }
  };

  const handleSign = () => {
    setManagerData(selected, managerName);
    navigation.replace('Main');
    setSelected(null);
  };

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ВЫБЕРИ КЛУБ</Text>
        <Text style={s.sub}>СЕЗОН 2025/26 · РЕЙТИНГ: {MANAGER_RATING}</Text>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'championship' && s.tabActive]} onPress={() => setTab('championship')}>
          <Text style={[s.tabText, tab === 'championship' && s.tabTextActive]}>ЧЕМПИОНШИП</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'epl' && s.tabActive]} onPress={() => setTab('epl')}>
          <Text style={[s.tabText, tab === 'epl' && s.tabTextActive]}>АПЛ</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clubs}
        keyExtractor={i => i.id}
        renderItem={({ item }) => {
          const locked = tab === 'epl' && MANAGER_RATING < item.minRating;
          return (
            <TouchableOpacity style={[s.card, locked && s.cardLocked]} onPress={() => handlePress(item)}>
              <ClubBadge club={item} size={52} />
              <View style={s.info}>
                <Text style={[s.name, locked && s.dimmed]}>{item.name}</Text>
                <Text style={[s.city, locked && s.dimmed]}>{item.city}</Text>
                <View style={s.row}>
                  <Text style={[s.stat, locked && s.dimmed]}>💰 £{item.budget}M</Text>
                  <Text style={[s.stat, locked && s.dimmed]}>⭐ {item.rating}</Text>
                </View>
              </View>
              {locked ? <Text style={s.lock}>🔒</Text> : <Text style={s.arrow}>›</Text>}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={s.list}
      />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            {selected?.locked ? (
              <>
                <Text style={s.modalLockIcon}>🔒</Text>
                <Text style={s.modalTitle}>НЕДОСТУПНО</Text>
                <Text style={s.modalSub}>Для {selected?.name} нужен рейтинг {selected?.minRating}+</Text>
                <Text style={s.modalHint}>Ваш рейтинг: {MANAGER_RATING}</Text>
                <TouchableOpacity style={s.btnClose} onPress={() => setSelected(null)}>
                  <Text style={s.btnCloseText}>ПОНЯТНО</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.modalTop}>
                  <ClubBadge club={selected} size={80} />
                  <View style={s.modalTopInfo}>
                    <Text style={s.modalTitle}>{selected?.name}</Text>
                    <Text style={s.modalCity}>{selected?.city}</Text>
                  </View>
                </View>

                <View style={s.modalStats}>
                  <View style={s.modalStat}>
                    <Text style={s.modalStatVal}>£{selected?.budget}M</Text>
                    <Text style={s.modalStatLabel}>БЮДЖЕТ</Text>
                  </View>
                  <View style={s.modalStat}>
                    <Text style={s.modalStatVal}>{selected?.rating}</Text>
                    <Text style={s.modalStatLabel}>РЕЙТИНГ</Text>
                  </View>
                </View>

                <View style={s.divider} />
                <Text style={s.modalSection}>🎯 ЦЕЛИ СЕЗОНА</Text>
                <Text style={s.modalText}>{selected?.goal}</Text>
                <Text style={s.modalSection}>📋 ОЖИДАНИЯ</Text>
                <Text style={s.modalText}>{selected?.expectations}</Text>

                <View style={s.modalBtns}>
                  <TouchableOpacity style={s.btnDecline} onPress={() => setSelected(null)}>
                    <Text style={s.btnDeclineText}>ОТКАЗАТЬСЯ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnSign} onPress={handleSign}>
                    <Text style={s.btnSignText}>ПОДПИСАТЬ</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: '#0a0a0f' },
  header:         { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title:          { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:            { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  tabs:           { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#12121a', borderRadius: 12, padding: 4 },
  tab:            { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  tabActive:      { backgroundColor: '#00d4ff' },
  tabText:        { fontSize: 12, fontWeight: '800', color: '#8888aa', letterSpacing: 2 },
  tabTextActive:  { color: '#000' },
  list:           { padding: 16, gap: 10 },
  card:           { backgroundColor: '#12121a', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#ffffff15' },
  cardLocked:     { opacity: 0.45 },
  info:           { flex: 1 },
  name:           { fontSize: 16, fontWeight: '800', color: '#fff' },
  city:           { fontSize: 12, color: '#8888aa', marginBottom: 6 },
  row:            { flexDirection: 'row', gap: 12 },
  stat:           { fontSize: 12, color: '#00d4ff' },
  arrow:          { fontSize: 24, color: '#8888aa' },
  lock:           { fontSize: 20 },
  dimmed:         { color: '#555' },
  overlay:        { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modal:          { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderWidth: 1, borderColor: '#ffffff15' },
  modalTop:       { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  modalTopInfo:   { flex: 1 },
  modalTitle:     { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  modalCity:      { fontSize: 12, color: '#8888aa', marginTop: 4, letterSpacing: 2 },
  modalStats:     { flexDirection: 'row', gap: 12, marginBottom: 20 },
  modalStat:      { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalStatVal:   { fontSize: 20, fontWeight: '900', color: '#00d4ff' },
  modalStatLabel: { fontSize: 10, color: '#8888aa', letterSpacing: 1, marginTop: 4 },
  divider:        { height: 1, backgroundColor: '#ffffff15', marginBottom: 16 },
  modalSection:   { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginBottom: 6 },
  modalText:      { fontSize: 14, color: '#fff', marginBottom: 16, lineHeight: 20 },
  modalBtns:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnDecline:     { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ffffff30', alignItems: 'center' },
  btnDeclineText: { color: '#8888aa', fontWeight: '700', letterSpacing: 2, fontSize: 13 },
  btnSign:        { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#00d4ff', alignItems: 'center' },
  btnSignText:    { color: '#000', fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  modalLockIcon:  { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  modalSub:       { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 8 },
  modalHint:      { fontSize: 12, color: '#8888aa', textAlign: 'center', marginBottom: 24 },
  btnClose:       { backgroundColor: '#00d4ff', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnCloseText:   { color: '#000', fontWeight: '900', letterSpacing: 2 },
});
