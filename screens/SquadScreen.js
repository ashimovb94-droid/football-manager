import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { loadManagerData } from '../utils/storage';
import { api } from '../utils/api';
import PlayerCard from '../components/PlayerCard';

const POSITIONS = ['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const POS_COLORS = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981',
  LW: '#ef4444', RW: '#ef4444', ST: '#ef4444',
};

export default function SquadScreen() {
  const [players, setPlayers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadManagerData().then(({ club }) => {
      if (club) loadPlayers(club.id);
    });
  }, []);

  useEffect(() => {
    if (filter === 'ALL') setFiltered(players);
    else setFiltered(players.filter(p => p.position === filter));
  }, [filter, players]);

  const loadPlayers = async (clubId) => {
    setLoading(true);
    try {
      const data = await api.getPlayers(clubId);
      setPlayers(data);
      setFiltered(data);
    } catch (e) {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayer = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
      <View style={[s.posTag, { backgroundColor: POS_COLORS[item.position] || '#666' }]}>
        <Text style={s.posText}>{item.position}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{item.name} {item.surname}</Text>
        <View style={s.row}>
          <Text style={s.detail}>{item.nationality}</Text>
          <Text style={s.detail}> · {item.age} лет</Text>
          <Text style={s.detail}> · £{item.salary}k</Text>
        </View>
      </View>
      <View style={s.overall}>
        <Text style={s.overallVal}>{item.overall}</Text>
        <Text style={s.overallLabel}>OVR</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>СОСТАВ</Text>
        <Text style={s.sub}>{filtered.length} ИГРОКОВ</Text>
      </View>

      <View style={s.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          {POSITIONS.map(item => (
            <TouchableOpacity
              key={item}
              style={[s.filterBtn, filter === item && s.filterActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[s.filterText, filter === item && s.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color="#00d4ff" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.loader}>
          <Text style={s.empty}>Нет игроков</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderPlayer}
          contentContainerStyle={s.list}
        />
      )}

      <PlayerCard
        player={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#0a0a0f' },
  header:           { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  title:            { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:              { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  filtersWrap:      { height: 48, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  filters:          { paddingHorizontal: 16, gap: 6, alignItems: 'center', height: 48 },
  filterBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#ffffff15' },
  filterActive:     { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  filterText:       { fontSize: 11, fontWeight: '800', color: '#8888aa', letterSpacing: 1 },
  filterTextActive: { color: '#000' },
  loader:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:            { color: '#8888aa', fontSize: 14 },
  list:             { padding: 16, gap: 8 },
  card:             { backgroundColor: '#12121a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#ffffff15' },
  posTag:           { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  posText:          { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  info:             { flex: 1 },
  name:             { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 3 },
  row:              { flexDirection: 'row' },
  detail:           { fontSize: 11, color: '#8888aa' },
  overall:          { alignItems: 'center' },
  overallVal:       { fontSize: 20, fontWeight: '900', color: '#00d4ff' },
  overallLabel:     { fontSize: 9, color: '#8888aa', letterSpacing: 1 },
});
