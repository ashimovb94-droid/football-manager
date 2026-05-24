import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { contrastTextColor } from './tokens';

const API_BASE = 'http://78.24.220.105:4000';

export default function ClubBadge({ club, size = 40 }) {
  const [failed, setFailed] = useState(false);

  if (!club) {
    return <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  const bg = club.primaryColor || '#1c2530';
  const accent = club.secondaryColor || '#ffb454';
  const txtColor = contrastTextColor(bg);

  // Если есть логотип — рисуем картинку с цветной обводкой и небольшим внутренним отступом
  if (club.logoUrl && !failed) {
    const url = club.logoUrl.startsWith('http')
      ? club.logoUrl
      : `${API_BASE}${club.logoUrl}`;
    return (
      <View
        style={[
          styles.logoWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#ffffff',
            borderColor: accent,
            borderWidth: size > 30 ? 2 : 1.5,
          },
        ]}
      >
        <Image
          source={{ uri: url }}
          style={{ width: size * 0.78, height: size * 0.78 }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  // Фолбэк — старый кружок с аббревиатурой
  return (
    <View
      style={[
        styles.badge,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: accent,
          borderWidth: size > 30 ? 2 : 1.5,
        },
      ]}
    >
      <Text style={[styles.short, { color: txtColor, fontSize: size * 0.32 }]}>
        {club.shortName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  short: { fontWeight: '700', letterSpacing: 0.5 },
  placeholder: { backgroundColor: '#1c2530', borderWidth: 1, borderColor: '#2a3441' },
});
