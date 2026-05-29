import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const POS_COLORS = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6', LWB: '#3b82f6', RWB: '#3b82f6',
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981', LM: '#10b981', RM: '#10b981',
  LW: '#ef4444', RW: '#ef4444', ST: '#ef4444',
};

const PHOTO_IDS = [9001, 9002]; // игроки с реальными фото
const BASE_URL = 'http://78.24.220.105:8000';

export default function PlayerAvatar({ player, size = 44, showPos = true }) {
  const color = POS_COLORS[player.position] || '#666';
  const hasPhoto = PHOTO_IDS.includes(Number(player.id));
  const posSize = Math.max(14, size * 0.32);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {hasPhoto ? (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33', borderWidth: 1.5, borderColor: color + '66', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Image
            source={{ uri: `${BASE_URL}/static/players/${player.id}.jpg?v=2` }}
            style={{ width: size * 0.9, height: size * 0.9 }}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33', borderColor: color + '66' }]}>
          <Ionicons name="person-outline" size={size * 0.5} color={color} />
        </View>
      )}
      {showPos && (
        <View style={[s.posBadge, { backgroundColor: color, minWidth: posSize + 4 }]}>
          <Text style={[s.posText, { fontSize: posSize * 0.6 }]}>{player.position}</Text>
        </View>
      )}
    </View>
  );
}

import { Text } from 'react-native';

const s = StyleSheet.create({
  avatar:   { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  posBadge: { position: 'absolute', bottom: -3, right: -3, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1, alignItems: 'center' },
  posText:  { color: '#fff', fontWeight: '900', letterSpacing: 0.3 },
});
