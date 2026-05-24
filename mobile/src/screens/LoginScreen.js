import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import { C, FX } from '../design/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  const submit = async () => {
    if (!username || !password) {
      Alert.alert('Заполни поля', 'Введи имя и пароль');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { username, password });
      await setAuth(data.token, {
        id: data.user.id,
        username: data.user.username,
        manager: {
          id: data.user.manager.id,
          name: data.user.manager.name,
          reputation: data.user.manager.reputation,
          clubId: data.user.manager.clubId,
        },
      });
    } catch (err) {
      Alert.alert(
        mode === 'login' ? 'Не получилось войти' : 'Не получилось зарегаться',
        err.response?.data?.error || err.message,
      );
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={[FX.bg, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.container}>
        <View style={s.logoBox}>
          <Ionicons name="football" size={48} color={C.accent} />
        </View>
        <Text style={s.title}>FOOTBALL MANAGER</Text>
        <Text style={s.subtitle}>{mode === 'login' ? 'Вход в систему' : 'Регистрация менеджера'}</Text>

        <View style={s.form}>
          <View style={s.inputWrap}>
            <Ionicons name="person-outline" size={16} color={C.muted} />
            <TextInput
              style={s.input}
              placeholder="Имя пользователя"
              placeholderTextColor={C.subtle}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color={C.muted} />
            <TextInput
              style={s.input}
              placeholder="Пароль"
              placeholderTextColor={C.subtle}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[s.button, loading && { opacity: 0.5 }]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.text} />
            ) : (
              <Text style={s.buttonText}>
                {mode === 'login' ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.switch}
            onPress={() => setMode(m => m === 'login' ? 'register' : 'login')}
          >
            <Text style={s.switchText}>
              {mode === 'login' ? 'Нет аккаунта? Зарегаться' : 'Уже есть аккаунт? Войти'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', padding: 24,
  },
  logoBox: {
    alignSelf: 'center',
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(79,195,247,0.1)',
    borderWidth: 2, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: C.text, fontSize: 22, fontWeight: '900',
    textAlign: 'center', letterSpacing: 2,
  },
  subtitle: {
    color: C.muted, fontSize: 12, textAlign: 'center',
    marginTop: 6, marginBottom: 36, letterSpacing: 1,
  },

  form: { gap: 12 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 12 },

  button: {
    backgroundColor: 'rgba(79,195,247,0.15)',
    paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.accent, marginTop: 8,
  },
  buttonText: { color: C.accent, fontSize: 14, fontWeight: '800', letterSpacing: 2 },

  switch: { padding: 12, alignItems: 'center' },
  switchText: { color: C.muted, fontSize: 12 },
});
