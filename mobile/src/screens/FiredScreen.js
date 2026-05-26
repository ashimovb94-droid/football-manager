import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../design/theme';

export default function FiredScreen({ navigation }) {
  return (
    <View style={st.container}>
      <Text style={st.emoji}>🚨</Text>
      <Text style={st.title}>ВЫ УВОЛЕНЫ</Text>
      <Text style={st.subtitle}>
        Руководство клуба приняло решение расстаться с вами.{'\n\n'}
        Репутация пострадала. Но карьера не закончена.
      </Text>

      <View style={st.divider} />

      <Text style={st.hint}>Найдите новый клуб и докажите всем, что это была их ошибка.</Text>

      <TouchableOpacity
        style={st.btn}
        onPress={() => navigation.replace('ClubSelect')}
        activeOpacity={0.8}
      >
        <Text style={st.btnText}>ИСКАТЬ НОВЫЙ КЛУБ →</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0a0a0a',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    color: '#ff3333', fontSize: 28, fontWeight: '900',
    letterSpacing: 3, textAlign: 'center', marginBottom: 16,
  },
  subtitle: {
    color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 24,
  },
  divider: {
    width: 60, height: 2, backgroundColor: '#ff3333',
    marginVertical: 28, opacity: 0.5,
  },
  hint: {
    color: '#666', fontSize: 13, textAlign: 'center',
    fontStyle: 'italic', marginBottom: 40,
  },
  btn: {
    backgroundColor: '#ff3333', paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 2,
  },
});
