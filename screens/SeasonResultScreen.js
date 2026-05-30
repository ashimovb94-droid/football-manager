import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { loadManagerData } from '../utils/storage';
import { api } from '../utils/api';
import ClubBadge from '../components/ClubBadge';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const getZone = (pos, league) => {
  if (league === 'championship') {
    if (pos <= 2) return { label: 'ПОВЫШЕНИЕ В АПЛ', color: '#00ff88', icon: 'arrow-up-circle-outline' };
    if (pos <= 6) return { label: 'ПЛЕЙ-ОФФ', color: '#00d4ff', icon: 'git-branch-outline' };
    if (pos >= 22) return { label: 'ВЫЛЕТ', color: '#ff3355', icon: 'arrow-down-circle-outline' };
  } else {
    if (pos <= 4) return { label: 'ЛИГА ЧЕМПИОНОВ', color: '#ffd700', icon: 'trophy-outline' };
    if (pos >= 18) return { label: 'ВЫЛЕТ', color: '#ff3355', icon: 'arrow-down-circle-outline' };
  }
  return null;
};

export default function SeasonResultScreen({ route }) {
  const { league, myClubId } = route.params || {};
  const [results, setResults] = useState(null);
  const [club, setClub] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadManagerData().then(({ club }) => setClub(club));
    api.getSeasonResults(league || 'championship').then(setResults);
  }, []);

  const myResult = results?.standings?.find(s => Number(s.club_id) === Number(myClubId || club?.id));
  const myPos = myResult?.position;
  const zone = myPos ? getZone(myPos, league || 'championship') : null;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ИТОГИ СЕЗОНА</Text>
        <Text style={s.sub}>{league === 'epl' ? 'АПЛ' : 'ЧЕМПИОНШИП'} · СЕЗОН 1</Text>
      </View>

      {/* Моё место */}
      {myResult && (
        <View style={[s.myCard, zone && { borderColor: zone.color + '60', backgroundColor: zone.color + '10' }]}>
          <View style={s.myTop}>
            <Text style={s.myPos}>#{myPos}</Text>
            <View>
              <Text style={s.myClub}>{myResult.club_name}</Text>
              <Text style={s.myPoints}>{myResult.points} очков · {myResult.won}П {myResult.drawn}Н {myResult.lost}П</Text>
            </View>
          </View>
          {zone && (
            <View style={[s.zoneBadge, { backgroundColor: zone.color + '20' }]}>
              <Ionicons name={zone.icon} size={18} color={zone.color} />
              <Text style={[s.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
            </View>
          )}
        </View>
      )}

      {/* Таблица */}
      <ScrollView contentContainerStyle={s.list}>
        {results?.standings?.map((item, i) => {
          const isMe = Number(item.club_id) === Number(club?.id);
          const z = getZone(item.position, league || 'championship');
          return (
            <View key={item.club_id} style={[s.row, isMe && s.rowMe]}>
              {z && <View style={[s.zoneBar, { backgroundColor: z.color }]} />}
              {!z && <View style={s.zoneBar} />}
              <Text style={[s.pos, isMe && s.textMe]}>{item.position}</Text>
              <ClubBadge club={{ id: String(item.club_id), primary: '#333', secondary: '#fff', name: item.club_name }} size={24} />
              <Text style={[s.clubName, isMe && s.textMe]} numberOfLines={1}>{item.club_name}</Text>
              <Text style={[s.pts, isMe && s.textMe]}>{item.points}</Text>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={s.btn} onPress={() => navigation.replace('Main')}>
        <Text style={s.btnText}>СЛЕДУЮЩИЙ СЕЗОН →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: '#0a0a0f' },
  header:    { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 },
  title:     { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:       { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  myCard:    { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#12121a', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#ffffff15', gap: 10 },
  myTop:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  myPos:     { fontSize: 40, fontWeight: '900', color: '#ffd700', width: 60 },
  myClub:    { fontSize: 18, fontWeight: '900', color: '#fff' },
  myPoints:  { fontSize: 12, color: '#8888aa', marginTop: 4 },
  zoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 8 },
  zoneLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  list:      { paddingHorizontal: 16, paddingBottom: 16, gap: 4 },
  row:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#12121a', borderRadius: 10, padding: 10, gap: 8 },
  rowMe:     { backgroundColor: '#00d4ff15', borderWidth: 1, borderColor: '#00d4ff30' },
  zoneBar:   { width: 3, height: 24, borderRadius: 2, backgroundColor: 'transparent' },
  pos:       { width: 24, fontSize: 12, color: '#8888aa', fontWeight: '700', textAlign: 'center' },
  clubName:  { flex: 1, fontSize: 12, color: '#fff', fontWeight: '600' },
  pts:       { fontSize: 14, color: '#00d4ff', fontWeight: '900', width: 30, textAlign: 'right' },
  textMe:    { color: '#00d4ff' },
  btn:       { margin: 16, backgroundColor: '#00d4ff', borderRadius: 14, padding: 18, alignItems: 'center' },
  btnText:   { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 2 },
});
