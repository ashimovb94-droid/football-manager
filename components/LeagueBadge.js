import { View, Image, Text, StyleSheet } from 'react-native';

const LOGOS = {
  epl:          require('../assets/clubs/epl.png'),
  championship: require('../assets/clubs/championship.png'),
};

const NAMES = {
  epl:          'АПЛ',
  championship: 'ЧЕМПИОНШИП',
};

export default function LeagueBadge({ league, size = 24, showName = false }) {
  const logo = LOGOS[league];
  if (!logo) return null;

  return (
    <View style={s.wrap}>
      <Image source={logo} style={{ width: size, height: size }} resizeMode="contain" />
      {showName && <Text style={s.name}>{NAMES[league]}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 11, color: '#8888aa', fontWeight: '700', letterSpacing: 1 },
});
