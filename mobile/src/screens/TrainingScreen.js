import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { C, FX } from '../design/theme';
import { api } from '../api';

const TRAINING_META = {
  GEGENPRESSING:  { icon: '⚡', color: '#FF9800', desc: 'Физика и скорость +1 для всех (25%)' },
  COUNTER_ATTACK: { icon: '🏃', color: '#9C27B0', desc: 'Скорость и удар +1 нападающим (30%)' },
  DIRECT:         { icon: '⬆️', color: '#F44336', desc: 'Удар и физика +1 нападающим (30%)' },
  POSSESSION:     { icon: '🎯', color: '#2196F3', desc: 'Пасы и дриблинг +1 ПЗ/атаке (30%)' },
  PARK_THE_BUS:   { icon: '🛡️', color: '#607D8B', desc: 'Защита и физика +1 защитникам (30%)' },
  TACTICS:        { icon: '🧠', color: '#00BCD4', desc: 'Форма +8 всем игрокам' },
};

export default function TrainingScreen() {
  const [data, setData] = useState({ active: null, available: [] });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/my/training');
      setData(d);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const startTraining = async (type) => {
    const meta = TRAINING_META[type];
    const t = data.available.find(t => t.type === type);
    const active = data.active;

    const doStart = async () => {
      setRunning(true);
      try {
        const { data: res } = await api.post('/my/training', { type });
        if (res.cancelled) {
          const partial = res.partialImprovements?.length > 0
            ? '\n\nЧастичный эффект:\n' + res.partialImprovements.map(i => `${i.name}: ${i.attr} ${i.from}→${i.to}`).join('\n')
            : '\n\nЭффекта не было.';
          Alert.alert('Тренировка сменена', `${res.cancelled} отменена.${partial}`);
        }
        await load();
      } catch (e) {
        Alert.alert('Ошибка', e.response?.data?.error || e.message);
      } finally {
        setRunning(false);
      }
    };

    if (active && active.type !== type) {
      Alert.alert(
        'Сменить тренировку?',
        `Идёт "${active.label}" (${active.progressPercent}% выполнено).\n\nОтменить и начать "${t?.label}"?\n\nЧастичный эффект будет применён.`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Сменить', style: 'destructive', onPress: doStart },
        ]
      );
    } else {
      Alert.alert(
        `${meta.icon} ${t?.label}`,
        `${meta.desc}\n\nДлительность: ${t?.durationLabel}\n\nНачать тренировку?`,
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Начать', onPress: doStart },
        ]
      );
    }
  };

  if (loading) return <View style={[FX.center, { flex: 1, backgroundColor: C.bg }]}><ActivityIndicator color={C.accent} /></View>;

  const { active, available } = data;

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={st.title}>ТРЕНИРОВКИ</Text>
      <Text style={st.hint}>Физподготовка — автоматически. Стратегические тренировки — ваш выбор.</Text>

      {/* Активная тренировка */}
      {active ? (
        <View style={[FX.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <Text style={{ color: C.subtext, fontSize: 11, marginBottom: 4 }}>АКТИВНАЯ ТРЕНИРОВКА</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>{TRAINING_META[active.type]?.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontWeight: 'bold', fontSize: 15 }}>{active.label}</Text>
              <Text style={{ color: C.subtext, fontSize: 12 }}>
                {active.completed ? '✅ Завершена' : `⏳ Осталось: ${active.hoursLeft}ч`}
              </Text>
            </View>
            <Text style={{ color: TRAINING_META[active.type]?.color, fontWeight: 'bold', fontSize: 16 }}>
              {active.progressPercent}%
            </Text>
          </View>
          {/* Прогресс бар */}
          <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
            <View style={{
              height: 6, borderRadius: 3,
              width: `${active.progressPercent}%`,
              backgroundColor: TRAINING_META[active.type]?.color ?? C.accent
            }} />
          </View>
        </View>
      ) : (
        <View style={[FX.card, { marginHorizontal: 16, marginBottom: 16, alignItems: 'center' }]}>
          <Text style={{ color: C.subtext, fontSize: 13 }}>Нет активной тренировки</Text>
        </View>
      )}

      {/* Список тренировок */}
      <Text style={[st.hint, { textAlign: 'left', marginHorizontal: 16, marginBottom: 8, color: C.text, fontWeight: '600' }]}>
        ВЫБРАТЬ ТРЕНИРОВКУ
      </Text>

      {available.filter(t => t.type !== active?.type).map(t => {
        const meta = TRAINING_META[t.type];
        const isActive = active?.type === t.type;
        if (!meta) return null;

        return (
          <TouchableOpacity
            key={t.type}
            style={[st.card, { borderLeftColor: meta.color, opacity: running ? 0.6 : 1 }]}
            onPress={() => startTraining(t.type)}
            activeOpacity={0.75}
            disabled={running}
          >
            <Text style={st.icon}>{meta.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={st.label}>{t.label}</Text>
                {isActive
                  ? <Text style={{ color: meta.color, fontSize: 11, fontWeight: 'bold' }}>● ИДЁТ</Text>
                  : <Text style={{ color: C.subtext, fontSize: 11 }}>{t.durationLabel}</Text>
                }
              </View>
              <Text style={st.desc}>{meta.desc}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingTop: 60 },
  title: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  hint: { color: C.subtext, fontSize: 11, textAlign: 'center', marginHorizontal: 20, marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14, borderLeftWidth: 4,
    borderWidth: 1, borderColor: C.border,
  },
  icon: { fontSize: 26, marginRight: 12 },
  label: { color: C.text, fontWeight: 'bold', fontSize: 14 },
  desc: { color: C.subtext, fontSize: 11, marginTop: 2 },
});
