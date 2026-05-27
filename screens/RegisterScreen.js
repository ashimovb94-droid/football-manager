import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import colors from '../theme/colors';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');

  return (
    <View style={s.screen}>
      <Text style={s.logo}>⚽</Text>
      <Text style={s.title}>FOOTBALL{'\n'}MANAGER</Text>
      <Text style={s.sub}>НАЧНИ СВОЮ ИСТОРИЮ</Text>
      <View style={s.inputWrap}>
        <Text style={s.label}>ИМЯ МЕНЕДЖЕРА</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Введи своё имя"
          placeholderTextColor={colors.textMuted}
          maxLength={20}
        />
      </View>
      <TouchableOpacity
        style={[s.btn, !name && s.btnDisabled]}
        disabled={!name}
        onPress={() => navigation.navigate('ClubSelect', { managerName: name })}
      >
        <Text style={s.btnText}>НАЧАТЬ КАРЬЕРУ</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo:        { fontSize: 64, marginBottom: 8 },
  title:       { fontSize: 36, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 4, lineHeight: 40 },
  sub:         { fontSize: 11, color: '#00d4ff', letterSpacing: 3, marginTop: 8, marginBottom: 48 },
  label:       { fontSize: 11, color: '#8888aa', letterSpacing: 2, marginBottom: 8 },
  inputWrap:   { width: '100%', marginBottom: 32 },
  input:       { backgroundColor: '#12121a', color: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#ffffff15' },
  btn:         { width: '100%', borderRadius: 14, backgroundColor: '#00d4ff', padding: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText:     { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 3 },
});
