import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { api } from '../utils/api';
import { saveSession, saveManagerData } from '../utils/storage';

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        res = await api.register(email, password, name);
      } else {
        res = await api.login(email, password);
      }
      if (res.detail) { setError(res.detail); return; }
      await saveSession(res.token, res);
      await saveManagerData(null, res.manager_name);
      if (res.club_id) {
        navigation.replace('Main');
      } else {
        navigation.replace('ClubSelect', { managerName: res.manager_name, token: res.token });
      }
    } catch (e) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.screen}>
      <View style={s.inner}>
        <Text style={s.logo}>⚽</Text>
        <Text style={s.title}>
          {mode === 'login' ? 'ВОЙТИ' : mode === 'register' ? 'РЕГИСТРАЦИЯ' : 'СБРОС ПАРОЛЯ'}
        </Text>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {mode === 'register' && (
          <View style={s.field}>
            <Text style={s.label}>ИМЯ МЕНЕДЖЕРА</Text>
            <TextInput style={s.input} value={name} onChangeText={setName}
              placeholder="Твоё имя" placeholderTextColor="#8888aa" />
          </View>
        )}

        <View style={s.field}>
          <Text style={s.label}>EMAIL</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="email@example.com" placeholderTextColor="#8888aa"
            keyboardType="email-address" autoCapitalize="none" />
        </View>

        {mode !== 'forgot' && (
          <View style={s.field}>
            <Text style={s.label}>ПАРОЛЬ</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              placeholder="••••••••" placeholderTextColor="#8888aa" secureTextEntry />
          </View>
        )}

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={s.btnText}>
                {mode === 'login' ? 'ВОЙТИ' : mode === 'register' ? 'СОЗДАТЬ АККАУНТ' : 'ОТПРАВИТЬ'}
              </Text>
          }
        </TouchableOpacity>

        {mode === 'login' && (
          <TouchableOpacity onPress={() => setMode('forgot')} style={s.link}>
            <Text style={s.linkText}>Забыли пароль?</Text>
          </TouchableOpacity>
        )}

        <View style={s.switchRow}>
          <Text style={s.switchText}>{mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}</Text>
          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={s.switchBtn}>{mode === 'login' ? ' Зарегистрироваться' : ' Войти'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#0a0a0f' },
  inner:       { flex: 1, padding: 32, justifyContent: 'center' },
  logo:        { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title:       { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4, textAlign: 'center', marginBottom: 40 },
  field:       { marginBottom: 20 },
  label:       { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginBottom: 8 },
  input:       { backgroundColor: '#12121a', color: '#fff', borderRadius: 12, padding: 16, fontSize: 15, borderWidth: 1, borderColor: '#ffffff15' },
  btn:         { backgroundColor: '#00d4ff', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 3 },
  error:       { color: '#ff3355', textAlign: 'center', marginBottom: 16, fontSize: 13 },
  link:        { alignItems: 'center', marginTop: 16 },
  linkText:    { color: '#8888aa', fontSize: 13 },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText:  { color: '#8888aa', fontSize: 13 },
  switchBtn:   { color: '#00d4ff', fontSize: 13, fontWeight: '700' },
});
