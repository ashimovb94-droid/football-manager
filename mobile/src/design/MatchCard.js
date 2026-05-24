import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ClubBadge from './ClubBadge';
import { colors, spacing, radii, typography } from './tokens';

// Карточка матча в одну строку: [Home badge + name] [score / time] [Away badge + name]
export default function MatchCard({ match, myClubId, onPress, showExtra }) {
  const played = match.status === 'PLAYED' && match.result;
  const isMine = match.home.id === myClubId || match.away.id === myClubId;
  const isHomeMine = match.home.id === myClubId;
  const isAwayMine = match.away.id === myClubId;

  const winnerHome = played && match.result.winnerClubId
    ? match.result.winnerClubId === match.home.id
    : played && match.result.home > match.result.away;
  const winnerAway = played && match.result.winnerClubId
    ? match.result.winnerClubId === match.away.id
    : played && match.result.away > match.result.home;
  const isDraw = played && !match.result.winnerClubId && match.result.home === match.result.away;

  return (
    <TouchableOpacity
      style={[styles.card, isMine && styles.cardMine]}
      onPress={onPress}
      disabled={!played || !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.side}>
        <ClubBadge club={match.home} size={32} />
        <Text
          style={[
            styles.teamName,
            (played && !winnerHome && !isDraw) && styles.teamLoser,
            isHomeMine && styles.teamMine,
          ]}
          numberOfLines={1}
        >
          {match.home.name}
        </Text>
      </View>

      <View style={styles.middle}>
        {played ? (
          <Text style={styles.score}>
            {match.result.home} <Text style={styles.colon}>:</Text> {match.result.away}
          </Text>
        ) : (
          <Text style={styles.vs}>vs</Text>
        )}
        {showExtra && played && match.result.homePens != null && (
          <Text style={styles.extra}>пен. {match.result.homePens}:{match.result.awayPens}</Text>
        )}
        {showExtra && played && match.result.homeET != null && match.result.homePens == null && (
          <Text style={styles.extra}>доп.вр. {match.result.homeET}:{match.result.awayET}</Text>
        )}
        {!played && <Text style={styles.statusText}>предстоит</Text>}
      </View>

      <View style={styles.side}>
        <Text
          style={[
            styles.teamName,
            { textAlign: 'right' },
            (played && !winnerAway && !isDraw) && styles.teamLoser,
            isAwayMine && styles.teamMine,
          ]}
          numberOfLines={1}
        >
          {match.away.name}
        </Text>
        <ClubBadge club={match.away} size={32} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cardMine: {
    borderLeftWidth: 3, borderLeftColor: colors.accent,
  },
  side: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  teamName: {
    flex: 1,
    color: colors.text, fontSize: typography.body, fontWeight: typography.semibold,
  },
  teamLoser: { color: colors.textMuted, fontWeight: typography.regular },
  teamMine: { color: colors.accent },
  middle: { width: 80, alignItems: 'center', marginHorizontal: spacing.sm },
  score: {
    color: colors.text, fontSize: typography.heading, fontWeight: typography.bold,
    letterSpacing: 0.5,
  },
  colon: { color: colors.textSubtle, fontWeight: typography.regular },
  vs: { color: colors.textSubtle, fontSize: typography.body },
  extra: { color: colors.warning, fontSize: typography.micro, marginTop: 2 },
  statusText: { color: colors.textSubtle, fontSize: typography.micro, marginTop: 2 },
});
