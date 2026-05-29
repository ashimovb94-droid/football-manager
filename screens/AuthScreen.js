import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { api } from '../utils/api';
import { saveSession, saveManagerData } from '../utils/storage';

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [questions, setQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetQuestion, setResetQuestion] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    api.getSecretQuestions().then(q => {
      setQuestions(q);
      if (q.length) setSecretQuestion(q[0]);
    });
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!username.trim()) { setError('Введи никнейм'); return; }
    if (!password) { setError('Введи пароль'); return; }
    if (mode === 'register' && !secretAnswer.trim()) { setError('Введи ответ на секретный вопрос'); return; }

    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        res = await api.register(username, password, secretQuestion, secretAnswer);
      } else {
        res = await api.login(username, password);
      }
      if (res.detail) { setError(res.detail); return; }
      await saveSession(res.token, res);
      await saveManagerData(res.club || null, res.manager_name);
      if (res.club_id && res.club) {
        navigation.replace('Main');
      } else {
        navigation.replace('ClubSelect', { managerName: res.manager_name });
      }
    } catch (e) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setLoading(true);
    try {
      if (resetStep === 1) {
        const res = await api.getResetQuestion(username);
        if (res.detail) { setError(res.detail); return; }
        setResetQuestion(res.question);
        setResetStep(2);
      } else {
        if (!secretAnswer.trim()) { setError('Введи ответ'); return; }
        if (!newPassword) { setError('Введи новый пароль'); return; }
        const res = await api.resetPassword(username, secretAnswer, newPassword);
        if (res.detail) { setError(res.detail); return; }
        setMode('login');
        setResetStep(1);
        setSecretAnswer('');
        setNewPassword('');
        setError('');
      }
    } catch (e) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.screen}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>⚽</Text>
        <Text style={s.title}>
          {mode === 'login' ? 'ВОЙТИ' : mode === 'register' ? 'РЕГИСТРАЦИЯ' : 'ВОССТАНОВЛЕНИЕ'}
        </Text>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        {/* ЛОГИН */}
        {mode === 'login' && (
          <>
            <View style={s.field}>
              <Text style={s.label}>НИКНЕЙМ</Text>
              <TextInput style={s.input} value={username} onChangeText={setUsername}
                placeholder="Твой никнейм" placeholderTextColor="#8888aa" autoCapitalize="none" />
            </View>
            <View style={s.field}>
              <Text style={s.label}>ПАРОЛЬ</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor="#8888aa" secureTextEntry />
            </View>
            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>ВОЙТИ</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMode('reset'); setResetStep(1); }} style={s.link}>
              <Text style={s.linkText}>Забыли пароль?</Text>
            </TouchableOpacity>
            <View style={s.switchRow}>
              <Text style={s.switchText}>Нет аккаунта?</Text>
              <TouchableOpacity onPress={() => setMode('register')}>
                <Text style={s.switchBtn}> Зарегистрироваться</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* РЕГИСТРАЦИЯ */}
        {mode === 'register' && (
          <>
            <View style={s.field}>
              <Text style={s.label}>НИКНЕЙМ</Text>
              <TextInput style={s.input} value={username} onChangeText={setUsername}
                placeholder="Минимум 3 символа" placeholderTextColor="#8888aa" autoCapitalize="none" />
            </View>
            <View style={s.field}>
              <Text style={s.label}>ПАРОЛЬ</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword}
                placeholder="Минимум 4 символа" placeholderTextColor="#8888aa" secureTextEntry />
            </View>
            <View style={s.field}>
              <Text style={s.label}>СЕКРЕТНЫЙ ВОПРОС</Text>
              <TouchableOpacity style={s.selector} onPress={() => setShowQuestions(true)}>
                <Text style={s.selectorText} numberOfLines={1}>{secretQuestion || 'Выбери вопрос'}</Text>
                <Text style={s.selectorArrow}>▾</Text>
              </TouchableOpacity>
            </View>
            <View style={s.field}>
              <Text style={s.label}>ОТВЕТ</Text>
              <TextInput style={s.input} value={secretAnswer} onChangeText={setSecretAnswer}
                placeholder="Твой ответ" placeholderTextColor="#8888aa" />
            </View>
            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>СОЗДАТЬ АККАУНТ</Text>}
            </TouchableOpacity>
            <View style={s.switchRow}>
              <Text style={s.switchText}>Уже есть аккаунт?</Text>
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={s.switchBtn}> Войти</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ВОССТАНОВЛЕНИЕ */}
        {mode === 'reset' && (
          <>
            {resetStep === 1 && (
              <>
                <Text style={s.resetHint}>Введи никнейм чтобы найти аккаунт</Text>
                <View style={s.field}>
                  <Text style={s.label}>НИКНЕЙМ</Text>
                  <TextInput style={s.input} value={username} onChangeText={setUsername}
                    placeholder="Твой никнейм" placeholderTextColor="#8888aa" autoCapitalize="none" />
                </View>
                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleReset} disabled={loading}>
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>НАЙТИ АККАУНТ</Text>}
                </TouchableOpacity>
              </>
            )}
            {resetStep === 2 && (
              <>
                <View style={s.questionBox}>
                  <Text style={s.questionLabel}>СЕКРЕТНЫЙ ВОПРОС</Text>
                  <Text style={s.questionText}>{resetQuestion}</Text>
                </View>
                <View style={s.field}>
                  <Text style={s.label}>ОТВЕТ</Text>
                  <TextInput style={s.input} value={secretAnswer} onChangeText={setSecretAnswer}
                    placeholder="Твой ответ" placeholderTextColor="#8888aa" />
                </View>
                <View style={s.field}>
                  <Text style={s.label}>НОВЫЙ ПАРОЛЬ</Text>
                  <TextInput style={s.input} value={newPassword} onChangeText={setNewPassword}
                    placeholder="Минимум 4 символа" placeholderTextColor="#8888aa" secureTextEntry />
                </View>
                <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleReset} disabled={loading}>
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnText}>СМЕНИТЬ ПАРОЛЬ</Text>}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => { setMode('login'); setResetStep(1); }} style={s.link}>
              <Text style={s.linkText}>← Назад к входу</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Выбор секретного вопроса */}
      <Modal visible={showQuestions} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>СЕКРЕТНЫЙ ВОПРОС</Text>
            <FlatList
              data={questions}
              keyExtractor={(item, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.questionItem} onPress={() => { setSecretQuestion(item); setShowQuestions(false); }}>
                  <Text style={[s.questionItemText, secretQuestion === item && s.questionItemActive]}>{item}</Text>
                  {secretQuestion === item && <Text style={s.checkMark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowQuestions(false)}>
              <Text style={s.closeBtnText}>ЗАКРЫТЬ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#0a0a0f' },
  inner:            { padding: 32, paddingTop: 60, paddingBottom: 40 },
  logo:             { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title:            { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4, textAlign: 'center', marginBottom: 32 },
  errorBox:         { backgroundColor: '#ff335520', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ff335540' },
  errorText:        { color: '#ff3355', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  field:            { marginBottom: 16 },
  label:            { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginBottom: 8 },
  input:            { backgroundColor: '#12121a', color: '#fff', borderRadius: 12, padding: 16, fontSize: 15, borderWidth: 1, borderColor: '#ffffff15' },
  selector:         { backgroundColor: '#12121a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ffffff15', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorText:     { color: '#fff', fontSize: 14, flex: 1 },
  selectorArrow:    { color: '#8888aa', fontSize: 16 },
  btn:              { backgroundColor: '#00d4ff', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  btnDisabled:      { opacity: 0.6 },
  btnText:          { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 3 },
  link:             { alignItems: 'center', marginTop: 16 },
  linkText:         { color: '#8888aa', fontSize: 13 },
  switchRow:        { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText:       { color: '#8888aa', fontSize: 13 },
  switchBtn:        { color: '#00d4ff', fontSize: 13, fontWeight: '700' },
  resetHint:        { fontSize: 13, color: '#8888aa', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  questionBox:      { backgroundColor: '#12121a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#00d4ff30' },
  questionLabel:    { fontSize: 10, color: '#8888aa', letterSpacing: 2, marginBottom: 6 },
  questionText:     { fontSize: 14, color: '#00d4ff', fontWeight: '700' },
  overlay:          { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  modal:            { backgroundColor: '#12121a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '60%' },
  modalTitle:       { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  questionItem:     { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#ffffff10', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionItemText: { fontSize: 14, color: '#fff', flex: 1 },
  questionItemActive:{ color: '#00d4ff', fontWeight: '700' },
  checkMark:        { fontSize: 16, color: '#00d4ff', fontWeight: '900' },
  closeBtn:         { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  closeBtnText:     { color: '#8888aa', fontWeight: '800', letterSpacing: 2 },
});
