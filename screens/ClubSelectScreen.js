import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { CHAMPIONSHIP_CLUBS } from '../data/clubs';

export default function ClubSelectScreen({ navigation, route }) {
  const { managerName } = route.params;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <Text style={s.title}>ВЫБЕРИ КЛУБ</Text>
        <Text style={s.sub}>ЧЕМПИОНШИП · СЕЗОН 1</Text>
      </View>
      <FlatList
        data={CHAMPIONSHIP_CLUBS}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate('Home', { managerName, club: item })}
          >
            <Text style={s.badge}>{item.badge}</Text>
            <View style={s.info}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.city}>{item.city}</Text>
              <View style={s.row}>
                <Text style={s.stat}>💰 £{item.budget}M</Text>
                <Text style={s.stat}>⭐ {item.rating}</Text>
              </View>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title:  { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  sub:    { fontSize: 11, color: '#00d4ff', letterSpacing: 2, marginTop: 4 },
  list:   { padding: 16, gap: 12 },
  card:   { backgroundColor: '#12121a', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff15' },
  badge:  { fontSize: 36, marginRight: 16 },
  info:   { flex: 1 },
  name:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  city:   { fontSize: 12, color: '#8888aa', marginBottom: 6 },
  row:    { flexDirection: 'row', gap: 12 },
  stat:   { fontSize: 12, color: '#00d4ff' },
  arrow:  { fontSize: 24, color: '#8888aa' },
});
