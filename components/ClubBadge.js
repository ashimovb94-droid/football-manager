import { View, Text, StyleSheet, Image } from 'react-native';

const LOGOS = {
  // Чемпионшип
  '1':  require('../assets/clubs/Coventry.png'),
  '2':  require('../assets/clubs/Ipswich.png'),
  '3':  require('../assets/clubs/Millwall.png'),
  '4':  require('../assets/clubs/Southampton.png'),
  '5':  require('../assets/clubs/Middlesbrough.png'),
  '6':  require('../assets/clubs/Hull.png'),
  '7':  require('../assets/clubs/Wrexham.png'),
  '8':  require('../assets/clubs/Derby.png'),
  '9':  require('../assets/clubs/Norwich.png'),
  '10': require('../assets/clubs/Birmingham.png'),
  '11': require('../assets/clubs/Swansea.png'),
  '12': require('../assets/clubs/Bristol.png'),
  '13': require('../assets/clubs/Sheffield_Utd.png'),
  '14': require('../assets/clubs/Preston.png'),
  '15': require('../assets/clubs/Queens.png'),
  '16': require('../assets/clubs/Watford.png'),
  '17': require('../assets/clubs/Stoke.png'),
  '18': require('../assets/clubs/Portsmouth.png'),
  '19': require('../assets/clubs/Charlton.png'),
  '20': require('../assets/clubs/Blackburn.png'),
  '21': require('../assets/clubs/Albion.png'),
  '22': require('../assets/clubs/Oxford.png'),
  '23': require('../assets/clubs/Leicester.png'),
  '24': require('../assets/clubs/Sheffield_Wednesday.png'),
  // АПЛ
  '101': require('../assets/clubs/man_city.png'),
  '102': require('../assets/clubs/arsenal.png'),
  '103': require('../assets/clubs/liverpool.png'),
  '104': require('../assets/clubs/chelsea.png'),
  '105': require('../assets/clubs/man_utd.png'),
  '106': require('../assets/clubs/tottenham.png'),
  '107': require('../assets/clubs/newcastle.png'),
  '108': require('../assets/clubs/aston_villa.png'),
  '109': require('../assets/clubs/brighton.png'),
  '110': require('../assets/clubs/west_ham.png'),
  '111': require('../assets/clubs/fulham.png'),
  '112': require('../assets/clubs/brentford.png'),
  '113': require('../assets/clubs/crystal_palace.png'),
  '114': require('../assets/clubs/everton.png'),
  '115': require('../assets/clubs/wolves.png'),
  '116': require('../assets/clubs/nottingham.png'),
  '117': require('../assets/clubs/bournemouth.png'),
  '118': require('../assets/clubs/sunderland.png'),
  '119': require('../assets/clubs/leeds.png'),
  '120': require('../assets/clubs/burnley.png'),
};

export default function ClubBadge({ club, size = 52 }) {
  const logo = LOGOS[club?.id];
  const initials = club?.name?.split(' ').map(w => w[0]).join('').slice(0, 3) || '?';

  if (logo) {
    return <Image source={logo} style={{ width: size, height: size }} resizeMode="contain" />;
  }

  return (
    <View style={[s.circle, {
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: club?.primary || '#12121a',
      borderColor: club?.secondary || '#fff',
    }]}>
      <Text style={[s.text, { fontSize: size * 0.28, color: club?.secondary || '#fff' }]}>{initials}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  text:   { fontWeight: '900', letterSpacing: 1 },
});
