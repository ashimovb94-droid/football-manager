import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { loadSession, saveManagerData } from '../utils/storage';
import { api } from '../utils/api';

export default function SplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start(() => setTimeout(checkSession, 300));
  }, []);

  const checkSession = async () => {
    try {
      const { token } = await loadSession();
      if (token) {
        const user = await api.getMe(token);
        if (user && !user.detail) {
          if (user.club_id && user.club) {
            await saveManagerData(user.club, user.manager_name);
            // Проверяем фазу игры
            try {
              const state = await api.getGameState(session.token);
              if (state?.phase === 'results') {
                navigation.replace('SeasonResult', {
                  league: state.league,
                  myClubId: state.club?.id
                });
                return;
              }
            } catch(e) {}
            navigation.replace('Main');
          } else {
            navigation.replace('ClubSelect', { managerName: user.manager_name });
          }
          return;
        }
      }
    } catch (e) {}
    navigation.replace('Auth');
  };

  return (
    <View style={s.screen}>
      <Animated.View style={[s.inner, { opacity, transform: [{ scale }] }]}>
        <Text style={s.logo}>⚽</Text>
        <Text style={s.title}>FOOTBALL</Text>
        <Text style={s.title}>MANAGER</Text>
        <View style={s.line} />
        <Text style={s.sub}>YOUR CAREER STARTS HERE</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' },
  inner:  { alignItems: 'center' },
  logo:   { fontSize: 80, marginBottom: 16 },
  title:  { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 6, lineHeight: 46 },
  line:   { width: 60, height: 2, backgroundColor: '#00d4ff', marginVertical: 16 },
  sub:    { fontSize: 11, color: '#00d4ff', letterSpacing: 4 },
});
