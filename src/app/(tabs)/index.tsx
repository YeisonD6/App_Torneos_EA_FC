import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Header } from '../../components/common/Header';
import { MatchCard } from '../../components/match/MatchCard';
import { Colors } from '../../constants/theme';
import { useTournament } from '../../features/tournament/TournamentContext';

export default function HomeScreen() {
  const { assignedClub, liveMatch, standings, matches } = useTournament();

  const userStanding = standings.find((s) => s.isUserClub) || standings[1];

  const handleEnterLiveMatch = () => {
    router.push('/live-match');
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Greeting Strip */}
        <View style={styles.greetingStrip}>
          <View>
            <Text style={styles.greetingHello}>HOLA, CAPITÁN</Text>
            <Text style={styles.greetingClubName}>{assignedClub.name}</Text>
          </View>
          <Badge label="EN COMPETICIÓN" variant="lime" size="sm" pulse />
        </View>

        {/* Live Match Hero Banner Card */}
        <Card variant="active" style={styles.liveHeroCard}>
          <View style={styles.liveHeroHeader}>
            <Badge label="LIVE NOW • SEGUNDA PARTE" variant="live" pulse />
            <Text style={styles.liveMinuteTicking}>68&apos; 2T</Text>
          </View>

          <View style={styles.scoreboardRow}>
            {/* Home Team */}
            <View style={styles.teamSide}>
              <View style={styles.crestCircle}>
                <Text style={styles.crestInitials}>{liveMatch.homeTeam.shortName}</Text>
              </View>
              <Text style={styles.heroTeamName} numberOfLines={1}>
                {liveMatch.homeTeam.name}
              </Text>
              <Text style={styles.heroCaptainTag}>TU ESCUADRA</Text>
            </View>

            {/* Score Center */}
            <View style={styles.heroScoreCenter}>
              <View style={styles.scoreRowLarge}>
                <Text style={styles.heroScoreDigitLime}>{liveMatch.homeScore}</Text>
                <Text style={styles.heroScoreHyphen}>-</Text>
                <Text style={styles.heroScoreDigitLime}>{liveMatch.awayScore}</Text>
              </View>
              <Text style={styles.heroTournamentMatchday}>JORNADA 6 OFICIAL</Text>
            </View>

            {/* Away Team */}
            <View style={styles.teamSide}>
              <View style={[styles.crestCircle, { borderColor: Colors.secondary }]}>
                <Text style={styles.crestInitials}>{liveMatch.awayTeam.shortName}</Text>
              </View>
              <Text style={styles.heroTeamName} numberOfLines={1}>
                {liveMatch.awayTeam.name}
              </Text>
              <Text style={styles.heroRivalTag}>RIVAL</Text>
            </View>
          </View>

          {/* CTA Button to Live Matchroom */}
          <Button
            title="Entrar al Partido en Vivo"
            onPress={handleEnterLiveMatch}
            variant="primary"
            icon={<MaterialIcons name="sports-esports" size={20} color={Colors.onPrimary} />}
            style={styles.enterMatchBtn}
          />
        </Card>

        {/* Tournament Stats Quad Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statTile}>
            <Text style={styles.statNumber}>{userStanding.points} PTS</Text>
            <Text style={styles.statLabel}>PUNTUACIÓN</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statNumber, { color: Colors.secondary }]}>
              #{userStanding.position} PUESTO
            </Text>
            <Text style={styles.statLabel}>POSICIÓN</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statNumber}>
              {userStanding.goalDiff > 0 ? `+${userStanding.goalDiff}` : userStanding.goalDiff} DG
            </Text>
            <Text style={styles.statLabel}>DIF. GOLES</Text>
          </View>
          <View style={styles.statTile}>
            <View style={styles.formRow}>
              {userStanding.form.map((f, i) => (
                <View
                  key={i}
                  style={[
                    styles.formDot,
                    f === 'W' && styles.formW,
                    f === 'D' && styles.formD,
                    f === 'L' && styles.formL,
                  ]}
                >
                  <Text style={styles.formLetter}>{f}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.statLabel}>RACHA ÚLTIMOS 5</Text>
          </View>
        </View>

        {/* Tactical Shortcuts Row */}
        <View style={styles.shortcutsRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/tactics')}
            style={styles.shortcutCard}
          >
            <View style={styles.shortcutIconWrap}>
              <MaterialCommunityIcons name="shield-half-full" size={22} color={Colors.primary} />
            </View>
            <View style={styles.shortcutTextCol}>
              <Text style={styles.shortcutTitle}>Pizarra Táctica</Text>
              <Text style={styles.shortcutSub}>4-3-3 • Presión Alta</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/dispute')}
            style={styles.shortcutCard}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: 'rgba(255, 201, 40, 0.15)' }]}>
              <MaterialIcons name="gavel" size={22} color={Colors.warning} />
            </View>
            <View style={styles.shortcutTextCol}>
              <Text style={styles.shortcutTitle}>Disputas VAR</Text>
              <Text style={styles.shortcutSub}>1 resuelta a favor</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Other Matches Today Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            PARTIDOS DE LA JORNADA {liveMatch.matchday || 6}
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/calendar')}>
            <Text style={styles.seeAllText}>VER CALENDARIO</Text>
          </Pressable>
        </View>

        {matches
          .filter((m) => m.id !== liveMatch.id)
          .slice(0, 3)
          .map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              onPress={() => router.push('/(tabs)/calendar')}
            />
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  greetingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingHello: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  greetingClubName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  liveHeroCard: {
    marginBottom: 16,
    backgroundColor: '#0E141C',
    borderColor: 'rgba(34, 211, 238, 0.45)',
    borderWidth: 1.5,
  },
  liveHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  liveMinuteTicking: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.secondary,
  },
  scoreboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  crestCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestInitials: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  heroTeamName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  heroCaptainTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  heroRivalTag: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  heroScoreCenter: {
    width: 100,
    alignItems: 'center',
    gap: 2,
  },
  scoreRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroScoreDigitLime: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
  },
  heroScoreHyphen: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  heroTournamentMatchday: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  enterMatchBtn: {
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statTile: {
    width: '48.5%',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 4,
  },
  formDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formW: {
    backgroundColor: 'rgba(57, 217, 138, 0.2)',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  formD: {
    backgroundColor: 'rgba(255, 201, 40, 0.2)',
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  formL: {
    backgroundColor: 'rgba(255, 70, 85, 0.2)',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  formLetter: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  shortcutsRow: {
    gap: 8,
    marginBottom: 20,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 12,
  },
  shortcutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(184, 255, 44, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTextCol: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shortcutSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
});
