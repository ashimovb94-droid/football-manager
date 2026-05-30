import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { loadSession } from '../utils/storage';
import { api } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CupResultScreen({ route }) {
  const { cupResult } = route?.params || {};
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiAnims = useRef([...Array(16)].map(() => ({
    x: new Animated.Value(Math.random() * 400 - 200),
    y: new Animated.Value(-50),
    rot: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    if (cupResult?.type === 'winner') {
      confettiAnims.forEach((anim, i) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(anim.y, { toValue: 900, duration: 2500 + Math.random() * 1000, useNativeDriver: true }),
            Animated.timing(anim.rot, { toValue: 360, duration: 2000, useNativeDriver: true }),
            Animated.timing(anim.opacity, { toValue: 0, duration: 3000, useNativeDriver: true }),
          ]).start();
        }, i * 100);
      });
    }
  }, []);

  const handleClose = async () => {
    const { token } = await loadSession();
    if (token) await api.clearPendingCup(token);
    navigation.replace('Main');
  };

  const isWinner = cupResult?.type === 'winner';
  const CONFETTI_COLORS = ['#ffd700','#00ff88','#00d4ff','#ff6b35','#ff3355','#7b2fff','#fff'];

  return (
    <View style={s.screen}>
      {isWinner && confettiAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[s.confetti, {
            left: 20 + (i * 22) % 360,
            transform: [{ translateY: anim.y }, { translateX: anim.x }, { rotate: anim.rot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
            opacity: anim.opacity,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            width: 8 + Math.random() * 8,
            height: 8 + Math.random() * 8,
          }]}
        />
      ))}

      <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Ionicons
          name={isWinner ? 'trophy' : 'medal-outline'}
          size={100}
          color={isWinner ? '#ffd700' : '#8888aa'}
        />

        <Text style={[s.title, { color: isWinner ? '#ffd700' : '#fff' }]}>
          {isWinner ? 'ОБЛАДАТЕЛЬ\nКУБКА АНГЛИИ!' : 'ФИНАЛИСТ\nКУБКА АНГЛИИ'}
        </Text>

        <View style={s.scoreCard}>
          <Text style={s.scoreClub}>{cupResult?.club_name}</Text>
          <Text style={s.score}>{cupResult?.score}</Text>
          <Text style={s.scoreClub}>{cupResult?.opponent}</Text>
        </View>

        {isWinner ? (
          <Text style={s.desc}>Поздравляем с победой в Кубке Англии! Исторический успех для клуба.</Text>
        ) : (
          <Text style={s.desc}>Вы дошли до финала Кубка Англии. Отличный результат в этом сезоне!</Text>
        )}

        <TouchableOpacity style={[s.btn, { borderColor: isWinner ? '#ffd700' : '#8888aa' }]} onPress={handleClose}>
          <Text style={[s.btnText, { color: isWinner ? '#ffd700' : '#fff' }]}>ПРОДОЛЖИТЬ →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center' },
  confetti:  { position: 'absolute', borderRadius: 2, zIndex: 999 },
  inner:     { alignItems: 'center', padding: 32, gap: 20 },
  title:     { fontSize: 32, fontWeight: '900', letterSpacing: 2, textAlign: 'center', lineHeight: 40 },
  scoreCard: { backgroundColor: '#12121a', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', gap: 6, borderWidth: 1, borderColor: '#ffffff15' },
  scoreClub: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  score:     { fontSize: 40, fontWeight: '900', color: '#ffd700', letterSpacing: 4 },
  desc:      { fontSize: 14, color: '#8888aa', textAlign: 'center', lineHeight: 22 },
  btn:       { borderWidth: 2, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 16 },
  btnText:   { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});
