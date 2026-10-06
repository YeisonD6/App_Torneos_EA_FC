import * as ScreenOrientation from 'expo-screen-orientation';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Colors } from '../constants/theme';
import { useTournament } from '../features/tournament/TournamentContext';
import { playersService } from '../services/players.service';
import { matchEventsService } from '../services/matchEvents.service';
import { Player } from '../types/database.types';

export default function LiveMatchScreen() {
  const insets = useSafeAreaInsets();
  const { liveMatch, addLiveEvent, finishMatch } = useTournament();
  const [matchMinute, setMatchMinute] = useState(68);
  const [modalType, setModalType] = useState<'goal' | 'yellow' | 'red' | null>(null);
  const [targetTeam, setTargetTeam] = useState<'home' | 'away'>('home');

  // Orientación horizontal durante el partido en vivo (FASE 10)
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // Búsqueda de jugadores con debouncing de 350ms
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const isSearching = searchQuery !== debouncedQuery;

  // Reloj dinámico de partido
  useEffect(() => {
    const timer = setInterval(() => {
      setMatchMinute((prev) => (prev < 90 ? prev + 1 : 90));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Debouncing de 350ms para el campo de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Consulta en PostgreSQL acotada estrictamente al club_id del equipo seleccionado
  useEffect(() => {
    const targetClubId = targetTeam === 'home' ? liveMatch.homeTeam.id : liveMatch.awayTeam.id;
    let isMounted = true;

    playersService.searchPlayersByClub(targetClubId, debouncedQuery).then((players) => {
      if (isMounted) {
        setSquadPlayers(players);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [targetTeam, debouncedQuery, liveMatch.homeTeam.id, liveMatch.awayTeam.id]);

  // Suscripción Realtime a eventos de partido
  useEffect(() => {
    if (!liveMatch.id) return;
    const sub = matchEventsService.subscribeToMatch(liveMatch.id, (incomingEvent) => {
      const isHome = incomingEvent.team_id === liveMatch.homeTeam.id;
      const mappedType =
        incomingEvent.event_type === 'goal'
          ? 'goal'
          : incomingEvent.event_type === 'yellow_card'
          ? 'yellow_card'
          : 'red_card';
      const playerName = incomingEvent.player?.name || 'Jugador Oficial';

      const alreadyExists = liveMatch.events.some(
        (e) =>
          e.id === incomingEvent.id ||
          (incomingEvent.client_event_id && e.id === incomingEvent.client_event_id)
      );

      if (!alreadyExists) {
        addLiveEvent(
          {
            type: mappedType,
            minute: `${incomingEvent.minute}'`,
            team: isHome ? 'home' : 'away',
            playerName,
            description: `${
              mappedType === 'goal'
                ? 'Gol'
                : mappedType === 'yellow_card'
                ? 'Tarjeta Amarilla'
                : 'Tarjeta Roja'
            } de ${playerName}`,
          },
          incomingEvent.player_id,
          incomingEvent.team_id
        );
      }
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [liveMatch.id, liveMatch.homeTeam.id, liveMatch.events, addLiveEvent]);

  const handleRegisterEvent = (player: Player) => {
    if (!modalType) return;
    const clubId = targetTeam === 'home' ? liveMatch.homeTeam.id : liveMatch.awayTeam.id;
    const teamName = targetTeam === 'home' ? liveMatch.homeTeam.name : liveMatch.awayTeam.name;

    if (modalType === 'goal') {
      addLiveEvent(
        {
          type: 'goal',
          minute: `${matchMinute}'`,
          team: targetTeam,
          playerName: player.name,
          description: `Gol de ${player.name} (${teamName})`,
        },
        player.id,
        clubId
      );
    } else if (modalType === 'yellow') {
      addLiveEvent(
        {
          type: 'yellow_card',
          minute: `${matchMinute}'`,
          team: targetTeam,
          playerName: player.name,
          description: `Tarjeta amarilla para ${player.name}`,
        },
        player.id,
        clubId
      );
    } else if (modalType === 'red') {
      addLiveEvent(
        {
          type: 'red_card',
          minute: `${matchMinute}'`,
          team: targetTeam,
          playerName: player.name,
          description: `Tarjeta roja directa para ${player.name}`,
        },
        player.id,
        clubId
      );
    }

    setModalType(null);
    setSearchQuery('');
  };

  const handleFinishAndReport = () => {
    finishMatch();
    router.push('/validation');
  };

  return (
    <View style={styles.container}>
      {/* Top Matchroom Header with Safe Area Inset */}
      <View
        style={[
          styles.topHeader,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: 14,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <MaterialIcons name="close" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleCol}>
          <Text style={styles.roomTitle}>SALA DE PARTIDO EN VIVO</Text>
          <Text style={styles.roomSubtitle}>CONEXIÓN CONSOLA EA FC 25</Text>
        </View>
        <Badge label="SERVIDOR OK" variant="lime" size="sm" pulse />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Giant Broadcast Scoreboard */}
        <Card variant="active" style={styles.scoreboardCard}>
          <View style={styles.clockRow}>
            <View style={styles.liveBeacon}>
              <View style={styles.liveBeaconDot} />
              <Text style={styles.liveBeaconText}>EN JUEGO</Text>
            </View>
            <Text style={styles.clockDigit}>{`${matchMinute}' MIN`}</Text>
            <Badge label="2T • OFICIAL" variant="cyan" size="sm" />
          </View>

          <View style={styles.teamsScoreRow}>
            {/* Home Team */}
            <View style={styles.teamCol}>
              <View style={styles.crestBox}>
                <Text style={styles.crestCode}>{liveMatch.homeTeam.shortName}</Text>
              </View>
              <Text style={styles.teamName}>{liveMatch.homeTeam.name}</Text>
              <Text style={styles.teamSideLabel}>LOCAL (TÚ)</Text>
            </View>

            {/* Scoreboard Number */}
            <View style={styles.scoreNumberCol}>
              <Text style={styles.scoreDigitBig}>{liveMatch.homeScore}</Text>
              <Text style={styles.scoreSeparator}>:</Text>
              <Text style={styles.scoreDigitBig}>{liveMatch.awayScore}</Text>
            </View>

            {/* Away Team */}
            <View style={styles.teamCol}>
              <View style={[styles.crestBox, { borderColor: Colors.secondary }]}>
                <Text style={styles.crestCode}>{liveMatch.awayTeam.shortName}</Text>
              </View>
              <Text style={styles.teamName}>{liveMatch.awayTeam.name}</Text>
              <Text style={styles.teamSideLabel}>VISITANTE</Text>
            </View>
          </View>
        </Card>

        {/* Quick Action Buttons for Operator */}
        <Text style={styles.sectionTitle}>REGISTRO DE INCIDENCIAS EN TIEMPO REAL</Text>
        <View style={styles.quickActionsGrid}>
          {/* Add Goal */}
          <Pressable
            onPress={() => {
              setTargetTeam('home');
              setModalType('goal');
            }}
            style={[styles.actionTile, styles.goalTile]}
          >
            <Text style={styles.goalEmoji}>⚽</Text>
            <View style={styles.actionTileTextCol}>
              <Text style={styles.goalTileTitle}>+ REGISTRAR GOL</Text>
              <Text style={styles.actionTileSub}>SUMA 1 AL MARCADOR</Text>
            </View>
          </Pressable>

          {/* Yellow Card */}
          <Pressable
            onPress={() => {
              setTargetTeam('home');
              setModalType('yellow');
            }}
            style={[styles.actionTile, styles.yellowTile]}
          >
            <View style={styles.yellowCardIcon} />
            <View style={styles.actionTileTextCol}>
              <Text style={styles.yellowTileTitle}>+ AMARILLA</Text>
              <Text style={styles.actionTileSub}>AMONESTACIÓN</Text>
            </View>
          </Pressable>

          {/* Red Card */}
          <Pressable
            onPress={() => {
              setTargetTeam('home');
              setModalType('red');
            }}
            style={[styles.actionTile, styles.redTile]}
          >
            <View style={styles.redCardIcon} />
            <View style={styles.actionTileTextCol}>
              <Text style={styles.redTileTitle}>+ ROJA</Text>
              <Text style={styles.actionTileSub}>EXPULSIÓN</Text>
            </View>
          </Pressable>
        </View>

        {/* Match Statistics Gauge */}
        <Card variant="surface" style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>ESTADÍSTICAS EN DIRECTO</Text>

          {/* Possession Bar */}
          <View style={styles.statRow}>
            <View style={styles.statHeader}>
              <Text style={styles.statHomeVal}>58%</Text>
              <Text style={styles.statLabel}>POSESIÓN</Text>
              <Text style={styles.statAwayVal}>42%</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFillHome, { width: '58%' }]} />
              <View style={[styles.barFillAway, { width: '42%' }]} />
            </View>
          </View>

          {/* Shots */}
          <View style={styles.statRow}>
            <View style={styles.statHeader}>
              <Text style={styles.statHomeVal}>7</Text>
              <Text style={styles.statLabel}>TIROS A PUERTA</Text>
              <Text style={styles.statAwayVal}>4</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFillHome, { width: '63%' }]} />
              <View style={[styles.barFillAway, { width: '37%' }]} />
            </View>
          </View>
        </Card>

        {/* Events Timeline Feed */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>ACTA CRONOLÓGICA DE EVENTOS</Text>

          <View style={styles.timelineList}>
            {liveMatch.events.map((evt) => (
              <View key={evt.id} style={styles.timelineItem}>
                <View style={styles.minutePill}>
                  <Text style={styles.minutePillText}>{evt.minute}</Text>
                </View>

                <View style={styles.eventIconWrap}>
                  {evt.type === 'goal' && <Text style={{ fontSize: 16 }}>⚽</Text>}
                  {evt.type === 'yellow_card' && <View style={styles.yellowCardIcon} />}
                  {evt.type === 'red_card' && <View style={styles.redCardIcon} />}
                </View>

                <View style={styles.eventInfoCol}>
                  <View style={styles.eventPlayerRow}>
                    <Text style={styles.eventPlayer}>{evt.playerName}</Text>
                    <View
                      style={[
                        styles.eventTeamBadge,
                        evt.team === 'home' ? styles.eventTeamBadgeHome : styles.eventTeamBadgeAway,
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventTeamBadgeText,
                          evt.team === 'home'
                            ? styles.eventTeamBadgeTextHome
                            : styles.eventTeamBadgeTextAway,
                        ]}
                      >
                        {evt.team === 'home'
                          ? liveMatch.homeTeam.shortName
                          : liveMatch.awayTeam.shortName}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.eventDesc}>{evt.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Finalize Match Button */}
        <Button
          title={`FINALIZAR Y REPORTAR (${liveMatch.homeScore} - ${liveMatch.awayScore})`}
          onPress={handleFinishAndReport}
          variant="primary"
          icon={<MaterialIcons name="done-all" size={20} color={Colors.onPrimary} />}
          style={styles.finishBtn}
        />
      </ScrollView>

      {/* Modal for selecting player on incident */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 24 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'goal' && '⚽ Registrar Gol'}
                {modalType === 'yellow' && '🟨 Tarjeta Amarilla'}
                {modalType === 'red' && '🟥 Tarjeta Roja Directa'}
              </Text>
              <Pressable onPress={() => setModalType(null)}>
                <MaterialIcons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {/* Team Selector in Modal */}
            <View style={styles.modalTeamTabs}>
              <Pressable
                onPress={() => setTargetTeam('home')}
                style={[styles.modalTeamTab, targetTeam === 'home' && styles.modalTeamTabActive]}
              >
                <Text style={[styles.modalTeamTabText, targetTeam === 'home' && styles.modalTeamTabTextActive]}>
                  {liveMatch.homeTeam.name} (Local)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setTargetTeam('away')}
                style={[styles.modalTeamTab, targetTeam === 'away' && styles.modalTeamTabActive]}
              >
                <Text style={[styles.modalTeamTabText, targetTeam === 'away' && styles.modalTeamTabTextActive]}>
                  {liveMatch.awayTeam.name} (Visitante)
                </Text>
              </Pressable>
            </View>

            <Text style={styles.selectPlayerLabel}>
              Plantel de {targetTeam === 'home' ? liveMatch.homeTeam.name : liveMatch.awayTeam.name}:
            </Text>

            {/* Debounced Search Input */}
            <View style={styles.searchBoxContainer}>
              <MaterialIcons name="search" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar jugador por nombre o dorsal..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <MaterialIcons name="close" size={18} color={Colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              style={styles.playerScrollArea}
              contentContainerStyle={styles.playerButtonsCol}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {squadPlayers.length === 0 ? (
                <Text style={styles.noPlayersText}>No se encontraron jugadores en el plantel</Text>
              ) : (
                squadPlayers.map((player) => (
                  <Pressable
                    key={player.id}
                    onPress={() => handleRegisterEvent(player)}
                    style={styles.playerSelectBtn}
                  >
                    <View style={styles.playerInfoRow}>
                      <View style={styles.shirtNumberPill}>
                        <Text style={styles.shirtNumberText}>{player.shirt_number || '•'}</Text>
                      </View>
                      <View>
                        <Text style={styles.playerSelectName}>{player.name}</Text>
                        <View style={styles.posRatingRow}>
                          <Text style={styles.positionBadgeText}>{player.position}</Text>
                          <Text style={styles.ratingBadgeText}>★ {player.rating}</Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons name="add-circle" size={22} color={Colors.primary} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  roomTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.6,
  },
  roomSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  scoreboardCard: {
    backgroundColor: '#0C1118',
    borderColor: 'rgba(34, 211, 238, 0.4)',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  liveBeacon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  liveBeaconText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
  },
  clockDigit: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  teamsScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  crestBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestCode: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  teamSideLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  scoreNumberCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreDigitBig: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.primary,
  },
  scoreSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  goalTile: {
    flex: 1.4,
    backgroundColor: 'rgba(184, 255, 44, 0.1)',
    borderColor: Colors.primary,
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalTileTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
  },
  yellowTile: {
    backgroundColor: 'rgba(255, 201, 40, 0.1)',
    borderColor: Colors.warning,
  },
  yellowCardIcon: {
    width: 12,
    height: 16,
    backgroundColor: Colors.warning,
    borderRadius: 2,
  },
  yellowTileTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.warning,
  },
  redTile: {
    backgroundColor: 'rgba(255, 70, 85, 0.1)',
    borderColor: Colors.danger,
  },
  redCardIcon: {
    width: 12,
    height: 16,
    backgroundColor: Colors.danger,
    borderRadius: 2,
  },
  redTileTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.danger,
  },
  actionTileTextCol: {
    flex: 1,
  },
  actionTileSub: {
    fontSize: 7,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 1,
  },
  statsCard: {
    marginBottom: 16,
    gap: 12,
  },
  statsCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  statRow: {
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statHomeVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statAwayVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceLow,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFillHome: {
    backgroundColor: Colors.primary,
    height: '100%',
  },
  barFillAway: {
    backgroundColor: Colors.secondary,
    height: '100%',
  },
  eventsSection: {
    marginBottom: 20,
  },
  timelineList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 48, 61, 0.4)',
  },
  minutePill: {
    width: 34,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
  },
  eventIconWrap: {
    width: 24,
    alignItems: 'center',
  },
  eventInfoCol: {
    flex: 1,
  },
  eventPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventPlayer: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  eventTeamBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  eventTeamBadgeHome: {
    backgroundColor: 'rgba(184, 255, 44, 0.12)',
    borderColor: Colors.primary,
  },
  eventTeamBadgeAway: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderColor: Colors.secondary,
  },
  eventTeamBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  eventTeamBadgeTextHome: {
    color: Colors.primary,
  },
  eventTeamBadgeTextAway: {
    color: Colors.secondary,
  },
  eventDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  finishBtn: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalTeamTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 8,
    padding: 3,
  },
  modalTeamTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modalTeamTabActive: {
    backgroundColor: Colors.surfaceHigh,
  },
  modalTeamTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modalTeamTabTextActive: {
    color: Colors.primary,
  },
  selectPlayerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  playerButtonsCol: {
    gap: 8,
  },
  playerSelectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLow,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playerSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  playerScrollArea: {
    maxHeight: 280,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shirtNumberPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shirtNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  posRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  positionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  noPlayersText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
