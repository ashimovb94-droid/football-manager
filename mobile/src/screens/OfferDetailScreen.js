import { useEffect, useState, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import ClubBadge from '../design/ClubBadge';
import { C, FX } from '../design/theme';

const fmtM = (s) => {
  const n = Number(s);
  if (n >= 1_000_000) return `€${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n/1_000).toFixed(0)}K`;
  return `€${n}`;
};

const getInitials = (f, l) =>
  `${(f||'').charAt(0)}${(l||'').charAt(0)}`.toUpperCase();

export default function OfferDetailScreen({ route, navigation }) {
  const { offerId, incoming } = route.params;
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [counterBack, setCounterBack] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'ДЕТАЛИ ОФЕРТЫ' });
  }, [navigation]);

  const load = async () => {
    try {
      const { data } = await api.get(incoming ? '/transfers/incoming' : '/transfers/my-offers');
      const o = data.find(x => x.id === offerId);
      if (o) {
        setOffer(o);
        const myAmt = Number(o.amount);
        setCounterBack(String(Math.round(myAmt * 1.05 / 1_000_000)));
      }
    } catch {}
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const respondCounter = async (action, newAmount) => {
    setSubmitting(true);
    try {
      const body = { offerId, action };
      if (action === 'COUNTER_BACK') body.newAmount = newAmount * 1_000_000;
      const { data } = await api.post('/transfers/respond-counter', body);

      if (data.result === 'CLUB_ACCEPTED') {
        Alert.alert(
          'Клуб согласился!',
          'Можно завершать сделку. Игрок ещё должен согласиться.',
          [{ text: 'Завершить', onPress: () => finalize() }],
        );
      } else if (data.result === 'COUNTER_OFFERED') {
        Alert.alert('Клуб торгуется', data.note);
        load();
      } else if (data.result === 'REJECTED_BY_CLUB') {
        Alert.alert('Клуб больше не торгуется', data.note);
        navigation.goBack();
      } else if (data.result === 'CANCELLED') {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    } finally { setSubmitting(false); }
  };

  const finalize = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/transfers/finalize', { offerId });
      if (data.result === 'DONE') {
        Alert.alert('✓ Сделка завершена!', `Игрок подписан за ${fmtM(data.amount)}`, [
          { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
      } else if (data.result === 'PLAYER_REJECTED') {
        Alert.alert('Игрок отказался', 'Не понравились условия.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );
  if (!offer) return (
    <View style={[FX.bg, FX.center]}><Text style={{ color: C.muted }}>Оферта не найдена</Text></View>
  );

  const isCounter = !incoming && offer.status === 'COUNTER_OFFERED';
  const isAccepted = !incoming && offer.status === 'CLUB_ACCEPTED';

  return (
    <ScrollView style={FX.bg} contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
      {/* Карточка игрока + клуб */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>ИГРОК</Text>
        <View style={s.playerRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{getInitials(offer.player.firstName, offer.player.lastName)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.playerName}>{offer.player.firstName} {offer.player.lastName}</Text>
            <Text style={s.playerMeta}>{offer.player.position} · {offer.player.age} лет</Text>
            <Text style={s.playerMv}>Рынок: {fmtM(offer.player.marketValue)}</Text>
          </View>
          <Text style={s.playerOvr}>{offer.player.overall}</Text>
        </View>

        <Text style={[s.sectionLabel, { marginTop: 14 }]}>{incoming ? 'КЛУБ-ПОКУПАТЕЛЬ' : 'КЛУБ-ПРОДАВЕЦ'}</Text>
        <View style={s.clubRow}>
          {(incoming ? offer.fromClub : offer.toClub) && <ClubBadge club={incoming ? offer.fromClub : offer.toClub} size={28} />}
          <Text style={s.clubName}>{(incoming ? offer.fromClub : offer.toClub)?.name}</Text>
        </View>
      </View>

      {/* Текущая ситуация */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>ХОД ПЕРЕГОВОРОВ</Text>

        <View style={s.row}>
          <Text style={s.rowLabel}>{incoming ? (offer.type === 'LOAN' ? 'ПЛАТЯТ ЗА АРЕНДУ' : 'ПРЕДЛОЖИЛИ') : 'ВАШЕ ПРЕДЛОЖЕНИЕ'}</Text>
          <Text style={s.rowValue}>{fmtM(offer.amount)}</Text>
        </View>

        {isCounter && offer.counterAmount && (
          <View style={[s.row, s.rowHighlight]}>
            <Text style={[s.rowLabel, { color: C.gold }]}>КЛУБ ХОЧЕТ</Text>
            <Text style={[s.rowValue, { color: C.gold, fontSize: 22 }]}>
              {fmtM(offer.counterAmount)}
            </Text>
          </View>
        )}
      </View>

      {/* История */}
      {offer.history && offer.history.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionLabel}>ИСТОРИЯ</Text>
          {offer.history.map((h, i) => (
            <View key={i} style={s.histRow}>
              <View style={[s.histDot, {
                backgroundColor: h.actor === 'club' ? C.gold
                  : h.actor === 'player' ? C.green
                  : h.actor === 'system' ? C.accent
                  : C.muted,
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.histActor}>
                  {h.actor === 'club' ? 'Клуб' : h.actor === 'player' ? 'Игрок' : h.actor === 'system' ? 'Система' : 'Вы'} · {h.action}
                </Text>
                {h.note && <Text style={s.histNote}>{h.note}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Действия для INCOMING оферт (AI клуб предложил нам) */}
      {incoming && (offer.status === 'PENDING' || offer.status === 'COUNTER_OFFERED') && (
        <View style={s.card}>
          <Text style={s.sectionLabel}>ВАШИ ДЕЙСТВИЯ</Text>

          {/* Принять — получить деньги */}
          <TouchableOpacity
            style={[s.actionBtn, { borderColor: C.green, backgroundColor: 'rgba(46,204,113,0.1)' }]}
            disabled={submitting}
            onPress={() => {
              Alert.alert(
                'Принять предложение?',
                `Получите ${fmtM(offer.amount)}. Игрок ${offer.type === 'LOAN' ? 'уедет в аренду' : 'перейдёт навсегда'}.`,
                [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Принять', onPress: async () => {
                    setSubmitting(true);
                    try {
                      const { data } = await api.post('/transfers/incoming/respond', { offerId, action: 'ACCEPT' });
                      Alert.alert(data.result === 'LOAN_DONE' ? '✓ Аренда оформлена' : '✓ Игрок продан', `Получили ${fmtM(offer.amount)}`, [
                        { text: 'OK', onPress: () => navigation.popToTop() },
                      ]);
                    } catch (err) {
                      Alert.alert('Ошибка', err.response?.data?.error || err.message);
                    } finally { setSubmitting(false); }
                  } },
                ]
              );
            }}
          >
            <Ionicons name="checkmark-circle" size={18} color={C.green} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.actionTitle, { color: C.green }]}>ПРИНЯТЬ ПРЕДЛОЖЕНИЕ</Text>
              <Text style={s.actionSub}>Получить {fmtM(offer.amount)}</Text>
            </View>
          </TouchableOpacity>

          {/* Контр-предложить — попросить больше */}
          <View style={[s.actionBtn, { borderColor: C.gold, backgroundColor: 'rgba(241,196,15,0.08)', flexDirection: 'column', alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trending-up" size={18} color={C.gold} />
              <Text style={[s.actionTitle, { color: C.gold, marginLeft: 10 }]}>ПОПРОСИТЬ БОЛЬШЕ</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
              <TextInput
                style={s.input}
                value={counterBack}
                onChangeText={setCounterBack}
                keyboardType="numeric"
                placeholder={String(Math.round(Number(offer.amount) * 1.2 / 1_000_000))}
                placeholderTextColor={C.subtle}
              />
              <Text style={{ color: C.muted, fontWeight: '700' }}>M€</Text>
              <TouchableOpacity
                style={s.sendBtn}
                disabled={submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    const { data } = await api.post('/transfers/incoming/respond', {
                      offerId,
                      action: 'COUNTER',
                      counterAmount: Number(counterBack) * 1_000_000,
                    });
                    if (data.result === 'AI_ACCEPTED') {
                      Alert.alert('✓ Клуб согласился!', `Получили ${fmtM(data.amount)}`, [
                        { text: 'OK', onPress: () => navigation.popToTop() },
                      ]);
                    } else if (data.result === 'AI_REJECTED') {
                      Alert.alert('Отказ', data.note);
                      navigation.goBack();
                    }
                  } catch (err) {
                    Alert.alert('Ошибка', err.response?.data?.error || err.message);
                  } finally { setSubmitting(false); }
                }}
              >
                <Ionicons name="paper-plane" size={14} color={C.gold} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Отклонить */}
          <TouchableOpacity
            style={[s.actionBtn, { borderColor: C.red, backgroundColor: 'rgba(231,76,60,0.08)' }]}
            disabled={submitting}
            onPress={() => {
              Alert.alert('Отклонить?', 'Клуб уйдёт ни с чем.', [
                { text: 'Назад', style: 'cancel' },
                { text: 'Отклонить', style: 'destructive', onPress: async () => {
                  setSubmitting(true);
                  try {
                    await api.post('/transfers/incoming/respond', { offerId, action: 'REJECT' });
                    navigation.goBack();
                  } catch (err) {
                    Alert.alert('Ошибка', err.response?.data?.error || err.message);
                  } finally { setSubmitting(false); }
                } },
              ]);
            }}
          >
            <Ionicons name="close-circle" size={18} color={C.red} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.actionTitle, { color: C.red }]}>ОТКЛОНИТЬ</Text>
              <Text style={s.actionSub}>Закрыть переговоры</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Действия для COUNTER_OFFERED */}
      {isCounter && (
        <View style={s.actionContainer}>
          <Text style={s.sectionLabel}>ВАШИ ДЕЙСТВИЯ</Text>

          {/* Кнопка: Согласиться */}
          <TouchableOpacity
            style={s.neutralBtn}
            disabled={submitting}
            onPress={() => respondCounter('ACCEPT')}
          >
            <Ionicons name="checkmark-circle" size={20} color={C.green} />
            <View style={s.btnTextContainer}>
              <Text style={s.actionTitle}>Принять условия</Text>
              <Text style={s.actionSub}>Заплатить {fmtM(offer.counterAmount)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>

          {/* Блок: Контр-предложение */}
          <View style={s.counterFormCard}>
            <View style={s.counterHeader}>
              <Ionicons name="trending-up" size={18} color={C.gold} />
              <Text style={[s.actionTitle, { marginLeft: 8 }]}>Торговаться</Text>
            </View>
            
            <View style={s.inputRow}>
              <View style={s.inputWrapper}>
                <TextInput
                  style={s.modernInput}
                  value={counterBack}
                  onChangeText={setCounterBack}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={C.subtle}
                />
                <Text style={s.inputCurrency}>M€</Text>
              </View>
              
              <TouchableOpacity
                style={s.submitCounterBtn}
                disabled={submitting}
                onPress={() => respondCounter('COUNTER_BACK', Number(counterBack))}
              >
                <Text style={s.submitBtnText}>Отправить</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Кнопка: Отказаться */}
          <TouchableOpacity
            style={s.neutralBtn}
            disabled={submitting}
            onPress={() => respondCounter('REJECT')}
          >
            <Ionicons name="close-circle" size={20} color={C.red} />
            <View style={s.btnTextContainer}>
              <Text style={s.actionTitle}>Выйти из переговоров</Text>
              <Text style={s.actionSub}>Отклонить оффер клуба</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Действия для CLUB_ACCEPTED */}
      {isAccepted && (
        <View style={s.card}>
          <Text style={s.sectionLabel}>КЛУБ СОГЛАСИЛСЯ</Text>
          <Text style={s.acceptedText}>
            Клуб готов отпустить игрока за {fmtM(offer.amount)}.
            Осталось договориться с самим игроком.
          </Text>
          <TouchableOpacity
            style={s.finalAcceptBtn}
            disabled={submitting}
            onPress={finalize}
          >
            <Ionicons name="checkmark-done" size={18} color="#000" />
            <Text style={s.finalAcceptBtnText}>
              ЗАВЕРШИТЬ СДЕЛКУ
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {submitting && (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ActivityIndicator color={C.accent} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },

  playerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  playerName: { color: C.text, fontSize: 15, fontWeight: '800' },
  playerMeta: { color: C.muted, fontSize: 12, marginTop: 4 },
  playerMv: { color: C.accent, fontSize: 11, marginTop: 4 },
  playerOvr: { color: C.gold, fontSize: 24, fontWeight: '900' },

  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clubName: { color: C.text, fontSize: 14, fontWeight: '700' },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  rowHighlight: {
    backgroundColor: 'rgba(241,196,15,0.05)',
    paddingVertical: 10, paddingHorizontal: 14,
    marginHorizontal: -14,
    borderTopWidth: 1, borderTopColor: 'rgba(241,196,15,0.2)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(241,196,15,0.2)',
  },
  rowLabel: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  rowValue: { color: C.text, fontSize: 18, fontWeight: '800' },

  histRow: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  histDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  histActor: { color: C.text, fontSize: 12, fontWeight: '700' },
  histNote: { color: C.muted, fontSize: 11, marginTop: 2 },

  actionContainer: {
    marginBottom: 20,
  },
  neutralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  btnTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: { 
    color: C.text,
    fontSize: 14, 
    fontWeight: '700',
  },
  actionSub: { 
    color: C.muted, 
    fontSize: 12, 
    marginTop: 2,
  },
  counterFormCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  modernInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    paddingLeft: 12,
    paddingRight: 45,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputCurrency: {
    position: 'absolute',
    right: 12,
    color: C.muted,
    fontWeight: '700',
    fontSize: 14,
  },
  submitCounterBtn: {
    backgroundColor: C.gold,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  acceptedText: { color: C.text, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  finalAcceptBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.green,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  finalAcceptBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

