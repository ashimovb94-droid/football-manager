import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { C, FX } from '../design/theme';
import { api } from '../api';

export default function SeasonResultsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/season/results').then(r => {
      setData(r.data);
    }).catch(e => {
      console.error(e);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={FX.center}><ActivityIndicator size="large" color={C.accent} /></View>;
  if (!data || !data.standings.length) return (
    <View style={FX.center}><Text style={{ color: C.text }}>Нет данных</Text></View>
  );

  const renderRow = ({ item: s }) => {
    const isMe = s.isMe;
    const isRelegated = s.position >= 18;
    const rowColor = isMe ? 'rgba(0,200,255,0.12)' : isRelegated ? 'rgba(255,50,50,0.08)' : 'transparent';
    const posColor = isRelegated ? '#ff4444' : s.position <= 4 ? '#4CAF50' : C.text;

    return (
      <View style={[st.row, { backgroundColor: rowColor }]}>
        <Text style={[st.pos, { color: posColor }]}>{s.position}</Text>
        <Text style={[st.name, isMe && { color: C.accent, fontWeight: 'bold' }]} numberOfLines={1}>
          {s.clubShort}{isMe ? ' ◀' : ''}
        </Text>
        <Text style={st.stat}>{s.played}</Text>
        <Text style={st.stat}>{s.won}</Text>
        <Text style={st.stat}>{s.drawn}</Text>
        <Text style={st.stat}>{s.lost}</Text>
        <Text style={[st.pts, isMe && { color: C.accent }]}>{s.points}</Text>
      </View>
    );
  };

  return (
    <View style={st.container}>
      <Text style={st.title}>ИТОГИ СЕЗОНА {data.season}</Text>

      {data.managerPosition && (
        <View style={[FX.card, { marginHorizontal: 16, marginBottom: 8, alignItems: 'center' }]}>
          <Text style={{ color: C.accent, fontWeight: 'bold', fontSize: 15 }}>
            {data.managerClub} — {data.managerPosition} место
          </Text>
          <Text style={{ color: data.managerPosition >= 18 ? '#ff4444' : '#4CAF50', fontSize: 13, marginTop: 4 }}>
            {data.managerPosition >= 18 ? '⬇ Вылет в Чемпионшип' : data.managerPosition <= 4 ? '🏆 Топ-4!' : '✅ Остались в АПЛ'}
          </Text>
        </View>
      )}

      {/* Шапка таблицы */}
      <View style={[st.row, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
        <Text style={[st.pos, { color: C.subtext }]}>#</Text>
        <Text style={[st.name, { color: C.subtext }]}>КЛУБ</Text>
        <Text style={[st.stat, { color: C.subtext }]}>И</Text>
        <Text style={[st.stat, { color: C.subtext }]}>В</Text>
        <Text style={[st.stat, { color: C.subtext }]}>Н</Text>
        <Text style={[st.stat, { color: C.subtext }]}>П</Text>
        <Text style={[st.pts, { color: C.subtext }]}>О</Text>
      </View>

      <FlatList
        data={data.standings}
        keyExtractor={s => s.clubId}
        renderItem={renderRow}
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      <TouchableOpacity
        style={[FX.card, { margin: 16, alignItems: 'center', backgroundColor: C.accent + '22' }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: C.accent, fontWeight: 'bold' }}>← НАЗАД</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingTop: 60 },
  title: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  pos: { width: 28, color: C.text, fontSize: 13, fontWeight: 'bold' },
  name: { flex: 1, color: C.text, fontSize: 13 },
  stat: { width: 26, color: C.subtext, fontSize: 12, textAlign: 'center' },
  pts: { width: 30, color: C.text, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
});
