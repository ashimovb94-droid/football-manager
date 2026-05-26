import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { api } from '../api';
import { useAuthStore } from '../store';
import ClubBadge from '../design/ClubBadge';
import { C, FX, zoneColorApl, zoneColorChamp } from '../design/theme';

export default function StandingsScreen() {
  const user = useAuthStore((s) => s.user);
  const myClubId = user?.manager?.clubId;

  const [leagues, setLeagues] = useState([]);
  const [activeCompId, setActiveCompId] = useState(null);
  const [rows, setRows] = useState([]);
  const [clubsMap, setClubsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeagues = useCallback(async () => {
    try {
      const { data: comps } = await api.get('/competitions');
      const lgs = comps.filter(c => c.type === 'LEAGUE').sort((a, b) => a.tier - b.tier);
      setLeagues(lgs);
      if (lgs.length && !activeCompId) setActiveCompId(lgs[0].id);
      const { data: clubs } = await api.get('/clubs');
      setClubsMap(Object.fromEntries(clubs.map(c => [c.id, c])));
    } catch {}
  }, [activeCompId]);

  const loadStandings = useCallback(async (compId) => {
    if (!compId) return;
    try {
      const { data } = await api.get(`/competitions/${compId}/standings`);
      setRows(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadLeagues(); }, []);
  useEffect(() => { if (activeCompId) loadStandings(activeCompId); }, [activeCompId, loadStandings]);

  if (loading) return (
    <View style={[FX.bg, FX.center]}><ActivityIndicator size="large" color={C.accent} /></View>
  );

  const activeLeague = leagues.find(l => l.id === activeCompId);
  const zoneFn = activeLeague?.tier === 2 ? zoneColorChamp : zoneColorApl;

  return (
    <View style={FX.bg}>
      {/* Переключатель лиг */}
      {leagues.length > 1 && (
        <View style={s.leagueTabs}>
          {leagues.map(lg => (
            <TouchableOpacity
              key={lg.id}
              style={[s.leagueTab, activeCompId === lg.id && s.leagueTabActive]}
              onPress={() => setActiveCompId(lg.id)}
            >
              <Text style={[s.leagueTabText, activeCompId === lg.id && s.leagueTabTextActive]}>
                {lg.tier === 1 ? 'АПЛ' : 'ЧЕМПИОНШИП'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Заголовок таблицы */}
      <View style={s.header}>
        <Text style={[s.cell, s.colPos]}>#</Text>
        <Text style={[s.cell, s.colName, { textAlign: 'left' }]}>КЛУБ</Text>
        <Text style={[s.cell, s.colNum]}>И</Text>
        <Text style={[s.cell, s.colGD]}>МЯЧИ</Text>
        <Text style={[s.cell, s.colPts]}>О</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.clubId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStandings(activeCompId); }} tintColor={C.accent} />}
        ListEmptyComponent={<Text style={s.empty}>Сезон ещё не начался</Text>}
        renderItem={({ item }) => {
          const zc = zoneFn(item.position);
          const isMine = item.clubId === myClubId;
          const clubData = clubsMap[item.clubId] || { shortName: item.clubShort, name: item.clubName };
          return (
            <View style={[s.row, isMine && s.rowMine]}>
              <View style={s.colPos}>
                <View style={[s.zoneBar, { backgroundColor: zc || 'transparent' }]} />
                <Text style={[s.cell, isMine && s.mineText]}>{item.position}</Text>
              </View>
              <View style={s.colName}>
                <ClubBadge club={clubData} size={22} />
                <View>
                  <Text style={[s.cell, s.clubName, isMine && s.mineText]} numberOfLines={1}>
                    {item.clubName}
                  </Text>
                  {item.managerName && (
                    <Text style={{ color: C.accent, fontSize: 9, paddingLeft: 4 }} numberOfLines={1}>
                      👤 {item.managerName}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[s.cell, s.colNum]}>{item.played}</Text>
              <Text style={[s.cell, s.colGD]}>{item.goalsFor}-{item.goalsAgainst}</Text>
              <Text style={[s.cell, s.colPts, s.ptsText]}>{item.points}</Text>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={s.legend}>
            {activeLeague?.tier === 1 ? (
              <>
                <LegendItem color={C.green} label="Лига чемпионов" />
                <LegendItem color={C.accent} label="Лига Европы" />
                <LegendItem color={C.gold} label="Лига конференций" />
                <LegendItem color={C.red} label="Вылет" />
              </>
            ) : (
              <>
                <LegendItem color={C.green} label="Повышение в АПЛ" />
                <LegendItem color={C.red} label="Вылет" />
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

function LegendItem({ color, label }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  leagueTabs: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8 },
  leagueTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  leagueTabActive: { borderBottomColor: C.accent },
  leagueTabText: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  leagueTabTextActive: { color: C.accent },

  header: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: C.border, marginTop: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rowMine: { backgroundColor: 'rgba(46,204,113,0.08)' },
  mineText: { color: C.green, fontWeight: '800' },
  cell: { color: C.text, fontSize: 12, textAlign: 'center', fontWeight: '600' },
  colPos: { width: 38, flexDirection: 'row', alignItems: 'center' },
  zoneBar: { width: 3, height: 22, borderRadius: 2, marginRight: 6 },
  colName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  clubName: { textAlign: 'left' },
  colNum: { width: 28 },
  colGD:  { width: 50 },
  colPts: { width: 32 },
  ptsText: { color: C.gold, fontWeight: '800', fontSize: 13 },

  empty: { color: C.subtle, textAlign: 'center', padding: 30 },
  legend: { paddingHorizontal: 16, paddingVertical: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendText: { color: C.muted, fontSize: 11 },
});
