import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Header } from '../components/common/Header';
import { Colors } from '../constants/theme';
import { getFallbackSquad } from '../data/scrapedData';
import { useTournament } from '../features/tournament/TournamentContext';

type PosFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';

export default function AssignedClubScreen() {
  const insets = useSafeAreaInsets();
  const { assignedClub } = useTournament();
  const [selectedFilter, setSelectedFilter] = useState<PosFilter>('ALL');

  const handleEnterTournament = () => {
    router.replace('/(tabs)');
  };

  const handleConfigureTactics = () => {
    router.replace('/(tabs)/tactics');
  };

  // Escuadra real obtenida del club asignado
  const squad = useMemo(() => {
    return getFallbackSquad(assignedClub.id || assignedClub.name);
  }, [assignedClub]);

  // Las 4 máximas estrellas de la plantilla ordenadas por media
  const topStars = useMemo(() => {
    return [...squad].sort((a, b) => b.rating - a.rating).slice(0, 4);
  }, [squad]);

  // Plantel filtrado por grupo de posición
  const filteredSquad = useMemo(() => {
    if (selectedFilter === 'ALL') return squad;
    return squad.filter((p) => p.position_group === selectedFilter);
  }, [squad, selectedFilter]);

  return (
    <View style={styles.container}>
      <Header
        title="Club Selection"
        subtitle="FASE PREVIA • CONFIRMACIÓN OFICIAL"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Celebration Badge */}
        <Badge
          label="¡ASIGNACIÓN EXITOSA! • ESCUADRA OFICIAL"
          variant="lime"
          size="md"
          pulse
          style={styles.congratsBadge}
        />

        {/* Club Crest & Glow Hero */}
        <View style={styles.heroSection}>
          <View style={styles.crestCircleWrap}>
            <View
              style={[
                styles.crestBackground,
                assignedClub.color ? { borderColor: assignedClub.color } : null,
              ]}
            >
              <MaterialCommunityIcons
                name="shield-crown"
                size={64}
                color={assignedClub.accentColor || Colors.primary}
              />
            </View>
            <View style={styles.verifiedTag}>
              <MaterialIcons name="verified" size={20} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.clubNameTitle}>{assignedClub.name}</Text>
          <Text style={styles.leagueSubtitle}>
            {(assignedClub.league || 'LIGA DE CAMPEONES').toUpperCase()} • ASIGNADO AL CAPITÁN
          </Text>
        </View>

        {/* Tactical Key Metrics Row */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{assignedClub.rating}</Text>
            <Text style={styles.metricLabel}>MEDIA GBL</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, { color: Colors.secondary }]}>
              {assignedClub.attack}
            </Text>
            <Text style={styles.metricLabel}>ATAQUE</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{assignedClub.defense}</Text>
            <Text style={styles.metricLabel}>DEFENSA</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, { color: Colors.primary }]}>
              {assignedClub.chemistry}/33
            </Text>
            <Text style={styles.metricLabel}>QUÍMICA</Text>
          </View>
        </View>

        {/* Recommended Formation Preview */}
        <Card variant="container" style={styles.tacticPreviewCard}>
          <View style={styles.tacticHeader}>
            <MaterialIcons name="tune" size={20} color={Colors.primary} />
            <Text style={styles.tacticTitle}>Táctica Preestablecida: 4-3-3 Ofensiva</Text>
          </View>
          <Text style={styles.tacticBody}>
            Presión alta tras pérdida, transiciones vertiginosas y posesión vertical en campo rival.
          </Text>
        </Card>

        {/* Key Squad Stars Section */}
        <View style={styles.starsSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>FIGURAS DESTACADAS DEL PLANTEL</Text>
            <Badge label="TOP MEDIAS" variant="cyan" size="sm" />
          </View>

          <View style={styles.starsGrid}>
            {topStars.map((player) => (
              <Card key={player.id} variant="surface" style={styles.playerCard}>
                <View style={styles.playerRatingPill}>
                  <Text style={styles.playerRatingText}>{player.rating}</Text>
                </View>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.playerPos}>
                  {player.position} • {player.nationality || 'Internacional'}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Full Squad Roster Section */}
        <View style={styles.rosterSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>PLANTEL COMPLETO ({squad.length} JUGADORES)</Text>
          </View>

          {/* Position Filter Pills */}
          <View style={styles.filterRow}>
            {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as PosFilter[]).map((f) => {
              const active = selectedFilter === f;
              const labels: Record<PosFilter, string> = {
                ALL: 'TODOS',
                GK: 'POR',
                DEF: 'DEF',
                MID: 'MED',
                FWD: 'DEL',
              };
              return (
                <Pressable
                  key={f}
                  onPress={() => setSelectedFilter(f)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                    {labels[f]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Roster List */}
          <View style={styles.rosterList}>
            {filteredSquad.map((player) => (
              <View key={player.id} style={styles.rosterRow}>
                <View style={styles.rosterNumberBox}>
                  <Text style={styles.rosterNumberText}>
                    {player.shirt_number || '-'}
                  </Text>
                </View>
                <View style={styles.rosterInfo}>
                  <Text style={styles.rosterName}>{player.name}</Text>
                  <Text style={styles.rosterMeta}>
                    {player.position} • {player.nationality}
                  </Text>
                </View>
                <View
                  style={[
                    styles.rosterRatingBadge,
                    player.rating >= 85 && styles.rosterRatingElite,
                  ]}
                >
                  <Text style={styles.rosterRatingText}>{player.rating}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action CTAs */}
        <View style={styles.actionColumn}>
          <Button
            title="Entrar al Torneo"
            onPress={handleEnterTournament}
            variant="primary"
            icon={<MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />}
          />

          <Button
            title="Configurar Pizarra Táctica"
            onPress={handleConfigureTactics}
            variant="secondary"
            icon={<MaterialIcons name="tune" size={20} color={Colors.textPrimary} />}
            style={styles.tacticsBtn}
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  congratsBadge: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crestCircleWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  crestBackground: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  verifiedTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  clubNameTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  leagueSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginTop: 4,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tacticPreviewCard: {
    padding: 16,
    marginBottom: 24,
  },
  tacticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tacticTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tacticBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  starsSection: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  starsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  playerCard: {
    width: '48%',
    padding: 12,
    position: 'relative',
  },
  playerRatingPill: {
    backgroundColor: 'rgba(184, 255, 44, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  playerRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  playerPos: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  rosterSection: {
    marginBottom: 28,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.onPrimary,
  },
  rosterList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rosterNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rosterNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rosterMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rosterRatingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rosterRatingElite: {
    backgroundColor: 'rgba(184, 255, 44, 0.2)',
  },
  rosterRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionColumn: {
    gap: 12,
  },
  tacticsBtn: {
    borderColor: Colors.border,
  },
});
