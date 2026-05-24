import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';
import { C, FX } from '../design/theme';

export default function CupScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const myClubId = user?.manager?.clubId;

  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(1);
  const [clubsMap, setClubsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: comps } = await api.get('/competitions');
      const cup = comps.find(c => c.type === 'CUP');
      if (!cup) { setRounds([]); return; }
      const { data } = await api.get(`/cup/${cup.id}/bracket`);
      setRounds(data);
      const { data: clubs } = await api.get('/clubs');
      setClubsMap(Object.fromEntries(clubs.map(c => [c.id, c])));

      if (myClubId) {
        const myRound = data.find(r =>
          r.matches.some(m => m.home.id === myClubId || m.away.id === myClubId)
        );
        setActiveRound(myRound?.round ?? data[0]?.round ?? 1);
      } else {
        setActiveRound(data[0]?.round ?? 1);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [myClubId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  if (!rounds.length) return (
    <View style={[FX.bg, FX.center]}>
      <Text style={s.empty}>Кубок пока недоступен</Text>
    </View>
  );

  const current = rounds.find(r => r.round === activeRound) ?? rounds[0];

  // Где я в кубке
  const myStatus = (() => {
    if (!myClubId) return null;
    for (const r of rounds) {
      const myMatch = r.matches.find(m => m.home.id === myClubId || m.away.id === myClubId);
      if (myMatch) {
        if (myMatch.status === 'PLAYED' && myMatch.result?.winnerClubId !== myClubId) {
          return { round: r.round, roundName: r.roundName, eliminated: true };
        }
        if (myMatch.status === 'SCHEDULED') {
          return { round: r.round, roundName: r.roundName, eliminated: false };
        }
      }
    }
    return null;
  })();

  return (
    <View style={FX.bg}>
      {myStatus && (
        <View style={[s.statusBar, myStatus.eliminated && s.statusBarOut]}>
          <Ionicons
            name={myStatus.eliminated ? "close-circle" : "trophy"}
            size={18}
            color={myStatus.eliminated ? C.red : C.green}
          />
          <Text style={[s.statusText, { color: myStatus.eliminated ? C.red : C.green }]}>
            {myStatus.eliminated
              ? `Вы вылетели на стадии "${myStatus.roundName}"`
              : `Ваш матч: ${myStatus.roundName}`}
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsContent}
        style={s.tabsScroll}
      >
        {rounds.map(r => (
          <TouchableOpacity
            key={r.round}
            style={[s.tab, activeRound === r.round && s.tabActive]}
            onPress={() => setActiveRound(r.round)}
          >
            <Text style={[s.tabText, activeRound === r.round && s.tabTextActive]}>
              {r.roundName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={current.matches}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        ListEmptyComponent={
          <Text style={s.empty}>
            Пары этого раунда ещё не определены{'\n'}— жди жеребьёвки после предыдущего раунда
          </Text>
        }
        renderItem={({ item }) => {
          const isMine = item.home.id === myClubId || item.away.id === myClubId;
          const played = item.status === 'PLAYED' && item.result;
          const homeWinner = played && item.result.winnerClubId === item.home.id;
          const awayWinner = played && item.result.winnerClubId === item.away.id;

          let extraLine = null;
          if (played) {
            if (item.result.homePens != null) {
              extraLine = `пен. ${item.result.homePens} : ${item.result.awayPens}`;
            } else if (item.result.homeET != null) {
              extraLine = `доп. вр. ${item.result.homeET} : ${item.result.awayET}`;
            }
          }

          return (
            <TouchableOpacity
              style={[s.matchCard, isMine && s.matchMine]}
              onPress={() => navigation.navigate('Match', { fixtureId: item.id })}
              disabled={!played}
              activeOpacity={0.7}
            >
              <View style={s.teamsRow}>
                <View style={s.teamSide}>
                  <ClubBadge club={{ ...item.home, ...(clubsMap[item.home.id] || {}) }} size={42} />
                  <Text style={[
                    s.teamName,
                    homeWinner && s.winnerText,
                    played && !homeWinner && s.loserText,
                  ]} numberOfLines={1}>
                    {item.home.name}
                  </Text>
                </View>

                <View style={s.scoreBox}>
                  {played ? (
                    <Text style={s.scoreText}>{item.result.home} : {item.result.away}</Text>
                  ) : (
                    <Text style={s.vsText}>VS</Text>
                  )}
                  {extraLine && <Text style={s.extraText}>{extraLine}</Text>}
                </View>

                <View style={s.teamSide}>
                  <ClubBadge club={{ ...item.away, ...(clubsMap[item.away.id] || {}) }} size={42} />
                  <Text style={[
                    s.teamName,
                    awayWinner && s.winnerText,
                    played && !awayWinner && s.loserText,
                  ]} numberOfLines={1}>
                    {item.away.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, marginTop: 12, padding: 12,
    backgroundColor: 'rgba(46,204,113,0.1)',
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.green,
  },
  statusBarOut: {
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderLeftColor: C.red,
  },
  statusText: { fontSize: 13, fontWeight: '600' },

  tabsScroll: { maxHeight: 52, marginTop: 10 },
  tabsContent: { paddingHorizontal: 12, gap: 6, paddingVertical: 4 },
  tab: {
    backgroundColor: C.card,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, borderColor: C.border,
  },
  tabActive: { backgroundColor: 'rgba(79,195,247,0.15)', borderColor: C.accent },
  tabText: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  tabTextActive: { color: C.accent },

  matchCard: {
    backgroundColor: C.card, borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  matchMine: { borderColor: C.borderActive },

  teamsRow: { flexDirection: 'row', alignItems: 'center' },
  teamSide: { flex: 1, alignItems: 'center', gap: 8 },
  teamName: { color: C.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  winnerText: { color: C.green, fontWeight: '800' },
  loserText: { color: C.muted, opacity: 0.7 },

  scoreBox: { width: 90, alignItems: 'center' },
  scoreText: { color: C.gold, fontSize: 18, fontWeight: '900' },
  vsText: { color: C.muted, fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  extraText: { color: C.accent, fontSize: 9, marginTop: 3 },

  empty: { color: C.subtle, textAlign: 'center', padding: 30, lineHeight: 18 },
});
