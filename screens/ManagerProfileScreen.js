import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { clearSession } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadManagerData, loadSession } from '../utils/storage';
import { useState, useEffect } from 'react';
import ClubBadge from '../components/ClubBadge';

export default function ManagerProfileScreen() {
  const navigation = useNavigation();
  const [club, setClub] = useState(null);
  const [managerName, setManagerName] = useState(null);

  useEffect(() => {
    loadManagerData().then(({ club, managerName }) => {
      setClub(club);
      setManagerName(managerName);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Ты уверен что хочешь выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            await AsyncStorage.removeItem('preseason_results');
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>ОФИС МЕНЕДЖЕРА</Text>
      </View>

      <ScrollView contentContainerStyle={s.inner}>
        {/* Карточка менеджера */}
        <View style={s.managerCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>👤</Text>
          </View>
          <View style={s.managerInfo}>
            <Text style={s.managerName}>{managerName}</Text>
            <Text style={s.managerTitle}>ГЛАВНЫЙ ТРЕНЕР</Text>
          </View>
          <View style={s.ratingBox}>
            <Text style={s.ratingVal}>50</Text>
            <Text style={s.ratingLabel}>РЕЙТИНГ</Text>
          </View>
        </View>

        {/* Текущий клуб */}
        {club && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>ТЕКУЩИЙ КЛУБ</Text>
            <View style={s.clubCard}>
              <ClubBadge club={club} size={48} />
              <View style={s.clubInfo}>
                <Text style={s.clubName}>{club.name}</Text>
                <Text style={s.clubLeague}>{club.league === 'epl' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿 АПЛ' : '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Чемпионшип'}</Text>
              </View>
              <View style={s.clubStats}>
                <Text style={s.clubBudget}>£{club.budget?.toFixed(0)}M</Text>
                <Text style={s.clubBudgetLabel}>БЮДЖЕТ</Text>
              </View>
            </View>
          </View>
        )}

        {/* История (заготовка) */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ИСТОРИЯ КАРЬЕРЫ</Text>
          <View style={s.historyCard}>
            <Text style={s.historyEmpty}>📋 История матчей появится после первого сезона</Text>
          </View>
        </View>

        {/* Достижения (заготовка) */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ДОСТИЖЕНИЯ</Text>
          <View style={s.historyCard}>
            <Text style={s.historyEmpty}>🏆 Выиграй первый трофей чтобы разблокировать</Text>
          </View>
        </View>

        {/* Выход */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutIcon}>🚪</Text>
          <Text style={s.logoutText}>ВЫЙТИ ИЗ АККАУНТА</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#0a0a0f' },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn:         { width: 36, height: 36, backgroundColor: '#12121a', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backText:        { fontSize: 18, color: '#00d4ff', fontWeight: '900' },
  title:           { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  inner:           { padding: 20, gap: 16 },
  managerCard:     { backgroundColor: '#12121a', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#ffffff15' },
  avatar:          { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00d4ff30' },
  avatarText:      { fontSize: 28 },
  managerInfo:     { flex: 1 },
  managerName:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  managerTitle:    { fontSize: 10, color: '#8888aa', letterSpacing: 2, marginTop: 3 },
  ratingBox:       { alignItems: 'center' },
  ratingVal:       { fontSize: 24, fontWeight: '900', color: '#ffd700' },
  ratingLabel:     { fontSize: 9, color: '#8888aa', letterSpacing: 1 },
  section:         { gap: 8 },
  sectionTitle:    { fontSize: 11, color: '#8888aa', letterSpacing: 2 },
  clubCard:        { backgroundColor: '#12121a', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#ffffff10' },
  clubInfo:        { flex: 1 },
  clubName:        { fontSize: 15, fontWeight: '800', color: '#fff' },
  clubLeague:      { fontSize: 11, color: '#8888aa', marginTop: 3 },
  clubStats:       { alignItems: 'center' },
  clubBudget:      { fontSize: 16, fontWeight: '900', color: '#00d4ff' },
  clubBudgetLabel: { fontSize: 9, color: '#8888aa', letterSpacing: 1 },
  historyCard:     { backgroundColor: '#12121a', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ffffff10', alignItems: 'center' },
  historyEmpty:    { fontSize: 13, color: '#8888aa', textAlign: 'center', lineHeight: 20 },
  logoutBtn:       { backgroundColor: '#ff335515', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#ff335540', marginTop: 8 },
  logoutIcon:      { fontSize: 20 },
  logoutText:      { fontSize: 14, fontWeight: '900', color: '#ff3355', letterSpacing: 2 },
});
