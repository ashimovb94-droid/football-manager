import { useEffect, useState, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import ClubBadge from '../design/ClubBadge';
import { C, FX, POS_COLOR, POSITION_GROUP } from '../design/theme';

const fmtM = (s) => {
  const n = Number(s);
  if (n >= 1_000_000) return `€${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n/1_000).toFixed(0)}K`;
  return `€${n}`;
};

const getInitials = (f, l) =>
  `${(f||'').charAt(0)}${(l||'').charAt(0)}`.toUpperCase();

export default function PlayerOfferScreen({ route, navigation }) {
  const { playerId, mode, offerId } = route.params;
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [wage, setWage] = useState('');
  const [years, setYears] = useState('3');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === 'free' ? 'Свободный агент'
           : mode === 'finalize' ? 'Завершение сделки'
           : 'Предложение по игроку',
    });
  }, [navigation, mode]);

  useEffect(() => {
    (async () => {
      try {
        const { data: p } = await api.get(`/transfers/player/${playerId}`);
        setPlayer(p);
        const mv = Number(p.marketValue);
        setAmount(String(Math.round(mv / 1_000_000)));
        const expectedWage = Math.max(500, mv / 200);
        setWage(String(Math.round(expectedWage / 1000)));
      } catch {}
      finally { setLoading(false); }
    })();
  }, [playerId, mode]);

  const submitOffer = async () => {
    if (!amount || isNaN(Number(amount))) return Alert.alert('Ошибка', 'Введите сумму');
    setSubmitting(true);
    try {
      const { data } = await api.post('/transfers/offer', {
        playerId,
        amount: Number(amount) * 1_000_000,
        proposedWage: Number(wage) * 1000,
        proposedYears: Number(years),
      });
      const result = data.clubDecision;
      if (result === 'ACCEPT') {
        Alert.alert(
          'Клуб согласен!',
          `Можно переходить к переговорам с игроком (€${wage}K/нед, ${years} года)`,
          [{ text: 'Завершить сделку', onPress: () => finalizeOffer(data.offer.id) }],
        );
      } else if (result === 'COUNTER') {
        Alert.alert('Контр-оферта', 'Клуб хочет больше — посмотри в Оферты');
        navigation.goBack();
      } else {
        Alert.alert('Отказ', 'Клуб посчитал сумму слишком низкой');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const finalizeOffer = async (oid) => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/transfers/finalize', { offerId: oid });
      if (data.result === 'DONE') {
        Alert.alert('✓ Сделка завершена!', `Игрок подписан за ${fmtM(data.amount)}`, [
          { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
      } else if (data.result === 'PLAYER_REJECTED') {
        Alert.alert('Игрок отказался', 'Не понравились условия. Попробуй повысить зарплату.');
      }
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const signFreeAgent = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/transfers/sign-free-agent', {
        playerId,
        wage: Number(wage) * 1000,
        years: Number(years),
      });
      if (data.result === 'SIGNED') {
        Alert.alert('✓ Подписан!', 'Игрок присоединился к команде', [
          { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
      } else {
        Alert.alert('Отказ', data.reason || 'Игрок не согласен на эти условия');
      }
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );
  if (!player) return (
    <View style={[FX.bg, FX.center]}><Text style={{ color: C.muted }}>Игрок не найден</Text></View>
  );

  const group = POSITION_GROUP[player.position] || 'MID';

  return (
    <ScrollView style={FX.bg} contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
      {/* Карточка игрока */}
      <View style={s.heroCard}>
        <View style={[s.heroAvatar, { borderColor: POS_COLOR[group] }]}>
          <Text style={s.heroAvatarText}>{getInitials(player.firstName, player.lastName)}</Text>
        </View>
        <Text style={s.heroName}>{player.firstName} {player.lastName}</Text>
        <View style={s.heroMeta}>
          <Text style={[s.heroPos, { color: POS_COLOR[group], borderColor: POS_COLOR[group] }]}>
            {player.position}
          </Text>
          <Text style={s.heroSub}>{player.age} лет · {player.nationality}</Text>
        </View>
        <View style={s.heroStats}>
          <View style={s.heroStat}>
            <Text style={s.heroStatLabel}>OVR</Text>
            <Text style={s.heroStatVal}>{player.overall}</Text>
          </View>
          <View style={s.heroStat}>
            <Text style={s.heroStatLabel}>ЦЕНА</Text>
            <Text style={[s.heroStatVal, { color: C.accent }]}>{fmtM(player.marketValue)}</Text>
          </View>
          {player.wage && (
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>З/П</Text>
              <Text style={[s.heroStatVal, { color: C.gold, fontSize: 16 }]}>{fmtM(player.wage)}/нед</Text>
            </View>
          )}
        </View>
        {player.club && (
          <View style={s.heroClub}>
            <ClubBadge club={player.club} size={24} />
            <Text style={s.heroClubName}>{player.club.name}</Text>
          </View>
        )}
      </View>

      {/* Атрибуты */}
      <View style={s.attrsCard}>
        <Text style={s.sectionLabel}>АТРИБУТЫ</Text>
        <Attr label="PAC" value={player.pace} />
        <Attr label="SHO" value={player.shooting} />
        <Attr label="PAS" value={player.passing} />
        <Attr label="DRI" value={player.dribbling} />
        <Attr label="DEF" value={player.defending} />
        <Attr label="PHY" value={player.physical} />
      </View>

      {/* Форма оферты */}
      <View style={s.formCard}>
        <Text style={s.sectionLabel}>
          {mode === 'free' ? 'ПОДПИСАТЬ КОНТРАКТ' : 'СДЕЛАТЬ ПРЕДЛОЖЕНИЕ'}
        </Text>

        {mode !== 'free' && (
          <View style={s.formRow}>
            <Text style={s.formLabel}>СУММА ТРАНСФЕРА (M€)</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={C.subtle}
            />
            <Text style={s.formHint}>Рыночная: {fmtM(player.marketValue)}</Text>
          </View>
        )}

        <View style={s.formRow}>
          <Text style={s.formLabel}>ЗАРПЛАТА (K€/неделя)</Text>
          <TextInput
            style={s.input}
            value={wage}
            onChangeText={setWage}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={C.subtle}
          />
        </View>

        <View style={s.formRow}>
          <Text style={s.formLabel}>ДЛИНА КОНТРАКТА (лет)</Text>
          <View style={s.yearsRow}>
            {[1,2,3,4,5].map(y => (
              <TouchableOpacity
                key={y}
                style={[s.yearChip, years === String(y) && s.yearChipActive]}
                onPress={() => setYears(String(y))}
              >
                <Text style={[s.yearChipText, years === String(y) && { color: C.bg }]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.5 }]}
          disabled={submitting}
          onPress={mode === 'free' ? signFreeAgent : submitOffer}
        >
          {submitting
            ? <ActivityIndicator color={C.text} />
            : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="paper-plane" size={16} color={C.green} />
                <Text style={s.submitText}>
                  {mode === 'free' ? 'ПОДПИСАТЬ' : 'ОТПРАВИТЬ ПРЕДЛОЖЕНИЕ'}
                </Text>
              </View>
            )
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Attr({ label, value }) {
  const color = value >= 80 ? C.green : value >= 65 ? C.accent : value >= 50 ? C.gold : C.red;
  return (
    <View style={s.attrRow}>
      <Text style={s.attrLabel}>{label}</Text>
      <View style={s.attrBar}>
        <View style={[s.attrFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.attrValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  heroCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  heroAvatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroName: { color: C.text, fontSize: 18, fontWeight: '800' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  heroPos: {
    fontSize: 11, fontWeight: '800',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1.5,
  },
  heroSub: { color: C.muted, fontSize: 12 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
  heroStat: { alignItems: 'center' },
  heroStatLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  heroStatVal: { color: C.gold, fontSize: 22, fontWeight: '900', marginTop: 4 },
  heroClub: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  heroClubName: { color: C.text, fontSize: 13, fontWeight: '600' },

  attrsCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  attrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  attrLabel: { color: C.muted, fontSize: 11, fontWeight: '800', width: 40 },
  attrBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
  attrFill: { height: '100%', borderRadius: 4 },
  attrValue: { width: 30, textAlign: 'right', fontWeight: '800', fontSize: 13 },

  formCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  formRow: { marginBottom: 14 },
  formLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  formHint: { color: C.subtle, fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: C.text, fontSize: 16, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
  },
  yearsRow: { flexDirection: 'row', gap: 6 },
  yearChip: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
  },
  yearChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  yearChipText: { color: C.muted, fontSize: 14, fontWeight: '800' },

  submitBtn: {
    marginTop: 8, padding: 14, borderRadius: 10,
    backgroundColor: 'rgba(46,204,113,0.15)',
    borderWidth: 1.5, borderColor: C.green,
    alignItems: 'center',
  },
  submitText: { color: C.green, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});
