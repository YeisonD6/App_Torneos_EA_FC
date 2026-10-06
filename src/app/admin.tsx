import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Header } from '../components/common/Header';
import { Colors } from '../constants/theme';
import { adminService } from '../services/admin.service';
import { tournamentsService } from '../services/tournaments.service';
import { Tournament, TournamentParticipant } from '../types/database.types';

type AdminTab = 'fixture' | 'participants' | 'disputes';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTab>('fixture');

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Dispute resolution form state
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState('3');
  const [awayScoreInput, setAwayScoreInput] = useState('0');
  const [verdictInput, setVerdictInput] = useState('Victoria por desconexión no justificada');

  useEffect(() => {
    let active = true;

    async function loadAdminData() {
      try {
        const tour = await tournamentsService.getActiveTournament();
        if (!active) return;
        setTournament(tour);

        const [parts, disps] = await Promise.all([
          tournamentsService.getTournamentParticipants(tour.id),
          adminService.getOpenDisputes(),
        ]);

        if (active) {
          setParticipants(parts);
          setDisputes(disps);
          setIsLoading(false);
        }
      } catch (e: any) {
        if (active) {
          setFeedbackMessage(e.message || 'Error al cargar datos de administración');
          setIsLoading(false);
        }
      }
    }

    loadAdminData();
    return () => {
      active = false;
    };
  }, []);

  const handleGenerateSchedule = async () => {
    if (!tournament) return;
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await adminService.generateRoundRobinSchedule(tournament.id);
      setFeedbackMessage(
        `✅ Fixture generado exitosamente: ${res.total_rounds || 5} jornadas y ${
          res.matches_created || 10
        } partidos programados.`
      );
    } catch (e: any) {
      setFeedbackMessage(`Error: ${e.message || 'No se pudo generar el fixture'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateNextMatchday = async () => {
    if (!tournament) return;
    const nextDay = (tournament.current_matchday || 1) + 1;
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      await adminService.activateMatchday(tournament.id, nextDay);
      setTournament((prev) => (prev ? { ...prev, current_matchday: nextDay } : null));
      setFeedbackMessage(`✅ Jornada ${nextDay} activada oficialmente para competición.`);
    } catch (e: any) {
      setFeedbackMessage(`Error: ${e.message || 'No se pudo activar la jornada'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    setActionLoading(true);
    try {
      const home = parseInt(homeScoreInput, 10) || 0;
      const away = parseInt(awayScoreInput, 10) || 0;
      await adminService.resolveMatchDispute(disputeId, home, away, verdictInput.trim());

      setDisputes((prev) => prev.filter((d) => d.id !== disputeId));
      setSelectedDisputeId(null);
      Alert.alert('Fallo Arbitral Emitido', 'El resultado fue registrado y la tabla actualizada.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo resolver la controversia');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Panel Administrador"
        subtitle="ORGANIZACIÓN OFICIAL DEL TORNEO"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tournament Overview Card */}
        <Card variant="active" style={styles.tourCard}>
          <View style={styles.tourHeader}>
            <View>
              <Text style={styles.tourName}>{tournament?.name || 'Torneo EA FC 25'}</Text>
              <Text style={styles.tourSub}>ESTADO: {(tournament?.status || 'ACTIVE').toUpperCase()}</Text>
            </View>
            <Badge
              label={`JORNADA ${tournament?.current_matchday || 1}`}
              variant="lime"
              size="md"
            />
          </View>
        </Card>

        {/* Tab Navigator */}
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('fixture')}
            style={[styles.tabBtn, activeTab === 'fixture' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'fixture' && styles.tabLabelActive]}>
              FIXTURE & JORNADAS
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('participants')}
            style={[styles.tabBtn, activeTab === 'participants' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'participants' && styles.tabLabelActive]}>
              PARTICIPANTES ({participants.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('disputes')}
            style={[styles.tabBtn, activeTab === 'disputes' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'disputes' && styles.tabLabelActive]}>
              ARBITRAJE ({disputes.length})
            </Text>
          </Pressable>
        </View>

        {/* Feedback Message */}
        {feedbackMessage && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando datos de administración...</Text>
          </View>
        ) : null}

        {/* TAB 1: FIXTURE & JORNADAS */}
        {activeTab === 'fixture' && !isLoading && (
          <View style={styles.sectionWrap}>
            <Card variant="container" style={styles.actionCard}>
              <View style={styles.actionCardHead}>
                <MaterialCommunityIcons name="tournament" size={24} color={Colors.primary} />
                <Text style={styles.actionCardTitle}>Generador Berger Round-Robin</Text>
              </View>
              <Text style={styles.actionCardDesc}>
                Genera el emparejamiento round-robin matemático balanceando localías y asignando fechas atómicas en la base de datos.
              </Text>
              <Button
                title={actionLoading ? 'GENERANDO FIXTURE...' : 'GENERAR FIXTURE OFICIAL'}
                onPress={handleGenerateSchedule}
                variant="primary"
                disabled={actionLoading}
                icon={<MaterialIcons name="refresh" size={18} color={Colors.onPrimary} />}
              />
            </Card>

            <Card variant="container" style={styles.actionCard}>
              <View style={styles.actionCardHead}>
                <MaterialIcons name="fast-forward" size={24} color={Colors.secondary} />
                <Text style={styles.actionCardTitle}>Control de Jornadas</Text>
              </View>
              <Text style={styles.actionCardDesc}>
                Activa la siguiente jornada competitiva para habilitar a los capitanes el reporte de actas y partidos en vivo.
              </Text>
              <Button
                title={
                  actionLoading
                    ? 'ACTIVANDO...'
                    : `ACTIVAR SIGUIENTE JORNADA (J${(tournament?.current_matchday || 1) + 1})`
                }
                onPress={handleActivateNextMatchday}
                variant="secondary"
                disabled={actionLoading}
                icon={<MaterialIcons name="play-arrow" size={18} color={Colors.textPrimary} />}
              />
            </Card>
          </View>
        )}

        {/* TAB 2: PARTICIPANTES */}
        {activeTab === 'participants' && !isLoading && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>CAPITANES & CLUBES ASIGNADOS</Text>
            {participants.map((p, idx) => (
              <Card key={p.id || idx} variant="surface" style={styles.participantCard}>
                <View style={styles.participantRow}>
                  <View style={styles.avatarCrest}>
                    <Text style={styles.avatarInitials}>
                      {p.club?.short_name || 'FC'}
                    </Text>
                  </View>
                  <View style={styles.participantMeta}>
                    <Text style={styles.participantTag}>
                      {p.profile?.gamer_tag || p.profile?.display_name || 'Capitán'}
                    </Text>
                    <Text style={styles.participantClub}>
                      {p.club?.name || 'Club no asignado'}
                    </Text>
                  </View>
                  <Badge
                    label={p.club ? `${p.club.rating} MED` : 'PENDIENTE'}
                    variant={p.club ? 'lime' : 'danger'}
                    size="sm"
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* TAB 3: DISPUTAS & ARBITRAJE */}
        {activeTab === 'disputes' && !isLoading && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>ACTAS DE PARTIDO EN DISPUTA</Text>

            {disputes.length === 0 ? (
              <Card variant="low" style={styles.emptyCard}>
                <MaterialCommunityIcons name="check-decagram" size={32} color={Colors.primary} />
                <Text style={styles.emptyTitle}>Sin Controversias Pendientes</Text>
                <Text style={styles.emptyDesc}>
                  Todas las actas de partido han sido confirmadas por consenso mutuo.
                </Text>
              </Card>
            ) : (
              disputes.map((d) => {
                const isSelected = selectedDisputeId === d.id;
                return (
                  <Card key={d.id} variant="surface" style={styles.disputeCard}>
                    <View style={styles.disputeHeader}>
                      <Badge label="DISPUTA ABIERTA" variant="danger" size="sm" />
                      <Text style={styles.disputeDate}>
                        {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <Text style={styles.disputeMatch}>
                      {d.home_club_name || d.match?.home_club?.name || 'Local'} vs{' '}
                      {d.away_club_name || d.match?.away_club?.name || 'Visitante'}
                    </Text>
                    <Text style={styles.disputeReason}>
                      Motivo: &quot;{d.reason}&quot;
                    </Text>

                    {isSelected ? (
                      <View style={styles.verdictBox}>
                        <Text style={styles.verdictTitle}>Dictamen Arbitral Oficial</Text>
                        <View style={styles.scoreRow}>
                          <View style={styles.scoreInputBox}>
                            <Text style={styles.scoreLabel}>Goles Local</Text>
                            <TextInput
                              style={styles.scoreInput}
                              value={homeScoreInput}
                              onChangeText={setHomeScoreInput}
                              keyboardType="numeric"
                            />
                          </View>
                          <Text style={styles.scoreVs}>-</Text>
                          <View style={styles.scoreInputBox}>
                            <Text style={styles.scoreLabel}>Goles Visitante</Text>
                            <TextInput
                              style={styles.scoreInput}
                              value={awayScoreInput}
                              onChangeText={setAwayScoreInput}
                              keyboardType="numeric"
                            />
                          </View>
                        </View>

                        <Text style={styles.scoreLabel}>Resolución / Fundamento:</Text>
                        <TextInput
                          style={styles.verdictTextInput}
                          value={verdictInput}
                          onChangeText={setVerdictInput}
                        />

                        <Button
                          title={actionLoading ? 'GUARDANDO...' : 'EMITIR FALLO OFICIAL'}
                          onPress={() => handleResolveDispute(d.id)}
                          variant="primary"
                          disabled={actionLoading}
                        />
                      </View>
                    ) : (
                      <Button
                        title="Resolver Controversia"
                        onPress={() => setSelectedDisputeId(d.id)}
                        variant="secondary"
                        style={styles.resolveBtn}
                      />
                    )}
                  </Card>
                );
              })
            )}
          </View>
        )}
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
  },
  tourCard: {
    padding: 16,
    marginBottom: 16,
  },
  tourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tourName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tourSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(184, 255, 44, 0.15)',
    borderColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  feedbackBox: {
    backgroundColor: 'rgba(184, 255, 44, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  feedbackText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  sectionWrap: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  actionCard: {
    padding: 16,
    gap: 10,
  },
  actionCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionCardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  participantCard: {
    padding: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCrest: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  participantMeta: {
    flex: 1,
  },
  participantTag: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  participantClub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  disputeCard: {
    padding: 14,
    gap: 8,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disputeDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  disputeMatch: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  disputeReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  resolveBtn: {
    marginTop: 6,
  },
  verdictBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  verdictTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondary,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scoreInputBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  scoreInput: {
    width: 60,
    height: 40,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  scoreVs: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMuted,
    marginTop: 14,
  },
  verdictTextInput: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.textPrimary,
    padding: 8,
    fontSize: 12,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
