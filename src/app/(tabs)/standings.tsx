import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { Colors } from '../../constants/theme';
import { useTournament } from '../../features/tournament/TournamentContext';

export default function StandingsScreen() {
  const { standings, assignedClub, selectedFormation, pitchWidth, pitchDepth, squad } = useTournament();
  const [activeTab, setActiveTab] = useState<'general' | 'miclub' | 'goleadores'>('general');

  const userRow = standings.find((s) => s.isUserClub) || standings[1] || {
    position: 2,
    clubName: assignedClub.name,
    shortName: assignedClub.shortName,
    played: 7,
    won: 5,
    drawn: 1,
    lost: 1,
    goalsFor: 16,
    goalsAgainst: 8,
    goalDiff: 8,
    points: 16,
    form: ['W', 'W', 'D', 'W', 'W'] as ('W' | 'D' | 'L')[],
    isUserClub: true,
  };

  const effectiveness = userRow.played > 0
    ? ((userRow.won / userRow.played) * 100).toFixed(1)
    : '0.0';
  const goalsPerMatch = userRow.played > 0
    ? (userRow.goalsFor / userRow.played).toFixed(1)
    : '0.0';
  const concededPerMatch = userRow.played > 0
    ? (userRow.goalsAgainst / userRow.played).toFixed(1)
    : '0.0';
  const cleanSheets = Math.max(1, Math.floor(userRow.won * 0.6));

  const userStarPlayer = squad.find((p) => p.position === 'DC' || p.position === 'DEL' || p.position === 'ED' || p.position === 'EI') || squad[0];
  const userScorerName = userStarPlayer ? userStarPlayer.name : 'Goleador Titular';

  const topScorers = [
    { rank: 1, name: 'Erling Haaland', team: 'MCI', goals: 9, matches: userRow.played || 7, isUser: assignedClub.shortName === 'MCI' },
    {
      rank: 2,
      name: assignedClub.shortName === 'MCI' ? 'Kylian Mbappé' : userScorerName,
      team: assignedClub.shortName,
      goals: Math.min(8, Math.max(4, Math.floor(userRow.goalsFor * 0.45))),
      matches: userRow.played || 7,
      isUser: true,
    },
    { rank: 3, name: 'Robert Lewandowski', team: 'BAR', goals: 6, matches: userRow.played || 7, isUser: assignedClub.shortName === 'BAR' },
    { rank: 4, name: 'Kylian Mbappé', team: 'RMA', goals: 6, matches: userRow.played || 7, isUser: assignedClub.shortName === 'RMA' },
    { rank: 5, name: 'Mohamed Salah', team: 'LIV', goals: 5, matches: userRow.played || 7, isUser: assignedClub.shortName === 'LIV' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Tabla" subtitle="CLASIFICACIÓN GENERAL OFICIAL" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Club Highlight Banner */}
        <Card variant="active" style={styles.clubBanner}>
          <View style={styles.bannerTop}>
            <View style={styles.bannerClubInfo}>
              <View style={styles.crestBox}>
                <Text style={styles.crestText}>{assignedClub.shortName}</Text>
              </View>
              <View>
                <Text style={styles.bannerClubTitle}>{assignedClub.name}</Text>
                <Text style={styles.bannerSub}>FASE REGULAR • JORNADA 6</Text>
              </View>
            </View>
            <Badge label={`#${userRow.position} PUESTO`} variant="lime" size="md" />
          </View>

          <View style={styles.bannerMetricsRow}>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatVal}>{userRow.points}</Text>
              <Text style={styles.bannerStatLbl}>PUNTOS</Text>
            </View>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatVal}>{userRow.won}</Text>
              <Text style={styles.bannerStatLbl}>VICTORIAS</Text>
            </View>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatVal}>{userRow.drawn}</Text>
              <Text style={styles.bannerStatLbl}>EMPATES</Text>
            </View>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatVal}>{userRow.lost}</Text>
              <Text style={styles.bannerStatLbl}>DERROTAS</Text>
            </View>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatVal}>
                {userRow.goalDiff > 0 ? `+${userRow.goalDiff}` : userRow.goalDiff}
              </Text>
              <Text style={styles.bannerStatLbl}>DIF. GOL</Text>
            </View>
          </View>
        </Card>

        {/* Segmented Filter Tabs */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setActiveTab('general')}
            style={[styles.tabBtn, activeTab === 'general' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>
              General
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('miclub')}
            style={[styles.tabBtn, activeTab === 'miclub' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'miclub' && styles.tabTextActive]}>
              Mi Club
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('goleadores')}
            style={[styles.tabBtn, activeTab === 'goleadores' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'goleadores' && styles.tabTextActive]}>
              Goleadores
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: General Standings Table */}
        {activeTab === 'general' && (
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.colHeader, styles.colPos]}>#</Text>
              <Text style={[styles.colHeader, styles.colClub]}>CLUB</Text>
              <Text style={[styles.colHeader, styles.colNum]}>PJ</Text>
              <Text style={[styles.colHeader, styles.colNum]}>G</Text>
              <Text style={[styles.colHeader, styles.colNum]}>E</Text>
              <Text style={[styles.colHeader, styles.colNum]}>P</Text>
              <Text style={[styles.colHeader, styles.colNum]}>DG</Text>
              <Text style={[styles.colHeader, styles.colPts]}>PTS</Text>
            </View>

            {/* Table Rows */}
            {standings.map((row, idx) => {
              const isTop4 = row.position <= 4;
              const isRelegation = row.position >= 11;
              const isUser = row.isUserClub;

              return (
                <View
                  key={row.clubName}
                  style={[
                    styles.tableRow,
                    idx % 2 === 0 ? styles.rowEven : styles.rowOdd,
                    isTop4 && styles.top4Row,
                    isRelegation && styles.relegationRow,
                    isUser && styles.userTableRow,
                  ]}
                >
                  <View style={styles.posCellWrapper}>
                    {isTop4 && <View style={styles.top4Indicator} />}
                    {isRelegation && <View style={styles.relegationIndicator} />}
                    <Text
                      style={[
                        styles.cellText,
                        styles.colPos,
                        isUser && styles.userHighlightText,
                      ]}
                    >
                      {row.position}
                    </Text>
                  </View>

                  <View style={[styles.clubCell, styles.colClub]}>
                    <Text
                      style={[styles.clubCellName, isUser && styles.userHighlightText]}
                      numberOfLines={1}
                    >
                      {row.clubName}
                    </Text>
                    {isUser && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>TÚ</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.cellText, styles.colNum]}>{row.played}</Text>
                  <Text style={[styles.cellText, styles.colNum]}>{row.won}</Text>
                  <Text style={[styles.cellText, styles.colNum]}>{row.drawn}</Text>
                  <Text style={[styles.cellText, styles.colNum]}>{row.lost}</Text>
                  <Text style={[styles.cellText, styles.colNum]}>
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </Text>
                  <Text
                    style={[
                      styles.cellText,
                      styles.colPts,
                      styles.ptsTextBold,
                      isUser && styles.userHighlightText,
                    ]}
                  >
                    {row.points}
                  </Text>
                </View>
              );
            })}

            {/* Legend Footer */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={styles.legendSquareLime} />
                <Text style={styles.legendText}>Puestos 1 - 4: Fase Final</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendSquareRed} />
                <Text style={styles.legendText}>Puestos 11 - 12: Descenso</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Mi Club Details */}
        {activeTab === 'miclub' && (
          <View style={styles.myClubDetailsCol}>
            <Card variant="container" style={styles.clubPerfCard}>
              <Text style={styles.perfCardTitle}>Rendimiento de Temporada</Text>
              <View style={styles.perfGrid}>
                <View style={styles.perfItem}>
                  <Text style={styles.perfValue}>{effectiveness}%</Text>
                  <Text style={styles.perfLabel}>EFECTIVIDAD</Text>
                </View>
                <View style={styles.perfItem}>
                  <Text style={styles.perfValue}>{goalsPerMatch}</Text>
                  <Text style={styles.perfLabel}>GOLES / PARTIDO</Text>
                </View>
                <View style={styles.perfItem}>
                  <Text style={styles.perfValue}>{concededPerMatch}</Text>
                  <Text style={styles.perfLabel}>GOLES RECIBIDOS</Text>
                </View>
                <View style={styles.perfItem}>
                  <Text style={styles.perfValue}>{cleanSheets}</Text>
                  <Text style={styles.perfLabel}>PORTERÍAS A CERO</Text>
                </View>
              </View>
            </Card>

            <Card variant="low" style={styles.clubTacticCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialIcons name="tune" size={20} color={Colors.primary} />
                <Text style={styles.perfCardTitle}>Esquema Táctico Actual</Text>
              </View>
              <Text style={styles.tacticSubText}>
                {selectedFormation} • Presión {pitchDepth > 70 ? 'alta tras pérdida de balón' : 'equilibrada'} • Amplitud táctica {pitchWidth}%
              </Text>
              <Button
                title="Ajustar en Pizarra Táctica"
                onPress={() => router.push('/(tabs)/tactics')}
                variant="outline"
                style={{ marginTop: 12 }}
              />
            </Card>
          </View>
        )}

        {/* Tab 3: Top Scorers */}
        {activeTab === 'goleadores' && (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.colHeader, { width: 36 }]}>#</Text>
              <Text style={[styles.colHeader, { flex: 1 }]}>JUGADOR</Text>
              <Text style={[styles.colHeader, { width: 50, textAlign: 'center' }]}>CLUB</Text>
              <Text style={[styles.colHeader, { width: 50, textAlign: 'center' }]}>PJ</Text>
              <Text style={[styles.colHeader, { width: 50, textAlign: 'center', color: Colors.primary }]}>
                GOLES
              </Text>
            </View>

            {topScorers.map((scorer) => (
              <View
                key={scorer.name}
                style={[
                  styles.tableRow,
                  scorer.isUser && styles.userTableRow,
                ]}
              >
                <Text style={[styles.cellText, { width: 36, fontWeight: '800' }]}>
                  {scorer.rank}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.clubCellName,
                      scorer.isUser && styles.userHighlightText,
                    ]}
                  >
                    {scorer.name}
                  </Text>
                </View>
                <Text style={[styles.cellText, { width: 50, textAlign: 'center', color: Colors.secondary }]}>
                  {scorer.team}
                </Text>
                <Text style={[styles.cellText, { width: 50, textAlign: 'center' }]}>
                  {scorer.matches}
                </Text>
                <Text
                  style={[
                    styles.cellText,
                    { width: 50, textAlign: 'center', fontWeight: '900', color: Colors.primary },
                  ]}
                >
                  {scorer.goals}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Action Footer */}
        <View style={styles.footerActions}>
          <Button
            title="Jugar Mi Partido en Directo"
            onPress={() => router.push('/live-match')}
            variant="primary"
            icon={<MaterialIcons name="sports-soccer" size={20} color={Colors.onPrimary} />}
          />
        </View>
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
    paddingBottom: 40,
  },
  clubBanner: {
    marginBottom: 16,
    backgroundColor: '#0F151E',
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bannerClubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crestBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  bannerClubTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bannerSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  bannerMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bannerStat: {
    alignItems: 'center',
  },
  bannerStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bannerStatLbl: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceHigh,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLow,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 48, 61, 0.4)',
  },
  rowEven: {
    backgroundColor: '#0D1118',
  },
  rowOdd: {
    backgroundColor: '#10141C',
  },
  top4Row: {},
  relegationRow: {},
  userTableRow: {
    backgroundColor: 'rgba(184, 255, 44, 0.08)',
    borderColor: Colors.primary,
  },
  posCellWrapper: {
    width: 26,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  top4Indicator: {
    position: 'absolute',
    left: -8,
    top: -2,
    bottom: -2,
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  relegationIndicator: {
    position: 'absolute',
    left: -8,
    top: -2,
    bottom: -2,
    width: 3,
    backgroundColor: Colors.danger,
    borderRadius: 1,
  },
  colPos: {
    width: 24,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  colClub: {
    flex: 1,
  },
  colNum: {
    width: 28,
    textAlign: 'center',
  },
  colPts: {
    width: 34,
    textAlign: 'right',
  },
  clubCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  clubCellName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  youBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.onPrimary,
  },
  cellText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ptsTextBold: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userHighlightText: {
    color: Colors.primary,
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: Colors.surfaceContainer,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSquareLime: {
    width: 8,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  legendSquareRed: {
    width: 8,
    height: 8,
    backgroundColor: Colors.danger,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  myClubDetailsCol: {
    gap: 12,
    marginBottom: 20,
  },
  clubPerfCard: {
    padding: 16,
  },
  perfCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  perfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  perfItem: {
    width: '48%',
    backgroundColor: Colors.surfaceLow,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  perfValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  perfLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  clubTacticCard: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tacticSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: 6,
  },
});
