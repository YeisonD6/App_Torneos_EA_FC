import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { Match } from '../../types/tournament';
import { Badge } from '../common/Badge';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
  featured?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onPress,
  featured = false,
}) => {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        featured && styles.featuredCard,
        isLive && styles.liveCard,
        pressed && styles.pressed,
      ]}
    >
      {/* Top Header of Match */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          {isLive ? (
            <Badge label={`LIVE • ${match.minute || "68' 2T"}`} variant="live" pulse />
          ) : isFinished ? (
            <Badge label="FINALIZADO" variant="muted" size="sm" />
          ) : (
            <Badge label={match.timeUTC || 'HOY 21:00 UTC'} variant="cyan" size="sm" />
          )}
          {match.isUserMatch && (
            <Badge label="TU PARTIDO" variant="lime" size="sm" />
          )}
        </View>

        <Text style={styles.matchdayText}>JORNADA {match.matchday}</Text>
      </View>

      {/* Main Scoreboard Layout */}
      <View style={styles.teamsRow}>
        {/* Home Team */}
        <View style={styles.teamCol}>
          <View style={[styles.crestPlaceholder, { borderColor: match.homeTeam.accentColor || Colors.primary }]}>
            <Text style={styles.crestText}>{match.homeTeam.shortName}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
          <Text style={styles.teamRating}>{match.homeTeam.rating} OVR</Text>
        </View>

        {/* Score / Center Column */}
        <View style={styles.scoreCol}>
          {isLive || isFinished ? (
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreDigit, isLive && styles.liveScoreDigit]}>
                {match.homeScore}
              </Text>
              <Text style={styles.scoreHyphen}>-</Text>
              <Text style={[styles.scoreDigit, isLive && styles.liveScoreDigit]}>
                {match.awayScore}
              </Text>
            </View>
          ) : (
            <View style={styles.vsBox}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          )}

          {isLive && (
            <Text style={styles.liveMinuteTag}>{match.minute || "68'"}</Text>
          )}
        </View>

        {/* Away Team */}
        <View style={[styles.teamCol, styles.awayTeamCol]}>
          <View style={[styles.crestPlaceholder, { borderColor: match.awayTeam.accentColor || Colors.secondary }]}>
            <Text style={styles.crestText}>{match.awayTeam.shortName}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.awayTeam.name}
          </Text>
          <Text style={styles.teamRating}>{match.awayTeam.rating} OVR</Text>
        </View>
      </View>

      {/* Bottom Action Footer for User Match */}
      {match.isUserMatch && isLive && (
        <View style={styles.footerRow}>
          <View style={styles.liveActionPrompt}>
            <MaterialIcons name="sports-esports" size={18} color={Colors.primary} />
            <Text style={styles.livePromptText}>PARTIDO EN CURSO EN EA FC</Text>
          </View>
          <View style={styles.arrowIconWrap}>
            <MaterialIcons name="chevron-right" size={20} color={Colors.primary} />
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginVertical: 6,
  },
  featuredCard: {
    backgroundColor: Colors.surfaceContainer,
    borderColor: Colors.borderLight,
  },
  liveCard: {
    borderColor: 'rgba(34, 211, 238, 0.4)',
    backgroundColor: 'rgba(18, 24, 33, 0.95)',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchdayText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  awayTeamCol: {},
  crestPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLow,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  teamRating: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  scoreCol: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scoreDigit: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveScoreDigit: {
    color: Colors.primary,
  },
  scoreHyphen: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  liveMinuteTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 2,
  },
  vsBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surfaceLow,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  liveActionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  arrowIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 255, 44, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
