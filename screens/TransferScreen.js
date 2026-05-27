import { View, Text, StyleSheet } from 'react-native';
export default function TransferScreen() {
  return (
    <View style={s.screen}>
      <Text style={s.title}>🔄 ТРАНСФЕРЫ</Text>
      <Text style={s.sub}>Скоро...</Text>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' },
  title:  { fontSize: 28, fontWeight: '900', color: '#fff' },
  sub:    { fontSize: 14, color: '#8888aa', marginTop: 8 },
});
