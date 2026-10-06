import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Header } from '../components/common/Header';
import { Colors } from '../constants/theme';
import { useTournament } from '../features/tournament/TournamentContext';

import { adminService } from '../services/admin.service';

export default function DisputeScreen() {
  const insets = useSafeAreaInsets();
  const { activeDispute, resolveDispute, refreshStandings } = useTournament();
  const [selectedVerdict, setSelectedVerdict] = useState<string>('v1');
  const [verdictIssued, setVerdictIssued] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const verdictOptions = [
    {
      id: 'v1',
      label: `Mantener ${activeDispute.reportedHomeScore} - ${activeDispute.reportedAwayScore} (Victoria ${activeDispute.homeTeamName})`,
      hScore: activeDispute.reportedHomeScore,
      aScore: activeDispute.reportedAwayScore,
    },
    {
      id: 'v2',
      label: `Decretar ${activeDispute.claimedHomeScore} - ${activeDispute.claimedAwayScore} (Empate por Caída de Servidor)`,
      hScore: activeDispute.claimedHomeScore,
      aScore: activeDispute.claimedAwayScore,
    },
    {
      id: 'v3',
      label: `Victoria Administrativa 3 - 0 (Abandono Rival)`,
      hScore: 3,
      aScore: 0,
    },
    {
      id: 'v4',
      label: 'Repetir Partido Completo (Fecha Extraordinaria)',
      hScore: 0,
      aScore: 0,
    },
  ];

  const handleIssueVerdict = async () => {
    const selected = verdictOptions.find((v) => v.id === selectedVerdict) || verdictOptions[0];
    try {
      await adminService.resolveMatchDispute(
        activeDispute.id,
        selected.hScore,
        selected.aScore,
        selected.label
      );
    } catch (e) {
      console.warn('Error resolviendo disputa en backend:', e);
    }
    resolveDispute(selected.label, selected.hScore, selected.aScore);
    await refreshStandings();
    setVerdictIssued(true);
    setTimeout(() => {
      router.replace('/(tabs)/standings');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Disputas"
        subtitle="SALA DE ARBITRAJE FEDERADO • VAR"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Case Badge Header */}
        <Badge
          label="EXPEDIENTE VAR #001 • COMITÉ DE COMPETICIÓN"
          variant="warning"
          size="md"
          pulse
          style={styles.caseBadge}
        />

        {verdictIssued && (
          <View style={styles.verdictToast}>
            <MaterialIcons name="gavel" size={20} color={Colors.onPrimary} />
            <Text style={styles.verdictToastText}>
              ¡Fallo vinculante emitido! La clasificación general se ha actualizado.
            </Text>
          </View>
        )}

        {/* Dispute Summary Card */}
        <Card variant="high" style={styles.summaryCard}>
          <Text style={styles.matchTitle}>
            {activeDispute.homeTeamName} vs {activeDispute.awayTeamName}
          </Text>
          <View style={styles.scoresCompareRow}>
            <View style={styles.scoreCompareBox}>
              <Text style={styles.scoreCompareLabel}>REPORTADO LOCAL</Text>
              <Text style={styles.scoreCompareVal}>
                {activeDispute.reportedHomeScore} - {activeDispute.reportedAwayScore}
              </Text>
            </View>
            <View style={styles.vsDivider}>
              <MaterialIcons name="compare-arrows" size={22} color={Colors.warning} />
            </View>
            <View style={styles.scoreCompareBox}>
              <Text style={styles.scoreCompareLabel}>ALEGADO RIVAL</Text>
              <Text style={[styles.scoreCompareVal, { color: Colors.secondary }]}>
                {activeDispute.claimedHomeScore} - {activeDispute.claimedAwayScore}
              </Text>
            </View>
          </View>
        </Card>

        {/* Testimony Comparison Section */}
        <Text style={styles.sectionTitle}>DECLARACIONES DE LOS CAPITANES</Text>

        {/* Home Captain Testimony */}
        <Card variant="low" style={styles.testimonyCard}>
          <View style={styles.testimonyHeader}>
            <View style={styles.captainBadge}>
              <MaterialIcons name="shield" size={14} color={Colors.primary} />
              <Text style={styles.captainBadgeText}>CAPITÁN {activeDispute.homeTeamName.toUpperCase()}</Text>
            </View>
            <Text style={styles.claimTime}>21:52 UTC</Text>
          </View>
          <Text style={styles.claimBody}>{activeDispute.homeClaimReason}</Text>
        </Card>

        {/* Away Captain Testimony */}
        <Card variant="low" style={styles.testimonyCard}>
          <View style={styles.testimonyHeader}>
            <View style={[styles.captainBadge, { borderColor: Colors.secondary }]}>
              <MaterialIcons name="shield" size={14} color={Colors.secondary} />
              <Text style={[styles.captainBadgeText, { color: Colors.secondary }]}>
                CAPITÁN {activeDispute.awayTeamName.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.claimTime}>21:55 UTC</Text>
          </View>
          <Text style={styles.claimBody}>{activeDispute.awayClaimReason}</Text>
        </Card>

        {/* Dual Photographic Evidence Showcase */}
        <Text style={styles.sectionTitle}>EVIDENCIAS FOTOGRÁFICAS ADJUNTAS (VAR)</Text>
        <View style={styles.evidenceGrid}>
          {/* Home Proof */}
          <Pressable
            onPress={() => setZoomImage(activeDispute.homeCaptainProofUrl)}
            style={styles.evidenceBox}
          >
            <Image
              source={{ uri: activeDispute.homeCaptainProofUrl }}
              style={styles.evidenceImg}
              resizeMode="cover"
            />
            <View style={styles.evidenceTag}>
              <Text style={styles.evidenceTagText}>Foto Captura Local (Tocar)</Text>
            </View>
          </Pressable>

          {/* Away Proof */}
          <Pressable
            onPress={() => setZoomImage(activeDispute.awayCaptainProofUrl)}
            style={styles.evidenceBox}
          >
            <Image
              source={{ uri: activeDispute.awayCaptainProofUrl }}
              style={styles.evidenceImg}
              resizeMode="cover"
            />
            <View style={styles.evidenceTag}>
              <Text style={styles.evidenceTagText}>Foto Error EA Rival (Tocar)</Text>
            </View>
          </Pressable>
        </View>

        {/* Verdict Selection Module */}
        <Card variant="surface" style={styles.verdictCard}>
          <View style={styles.verdictHeaderRow}>
            <MaterialIcons name="gavel" size={20} color={Colors.primary} />
            <Text style={styles.verdictHeaderTitle}>Veredicto y Asignación de Puntos</Text>
          </View>

          <View style={styles.verdictOptionsCol}>
            {verdictOptions.map((opt) => {
              const isSelected = selectedVerdict === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedVerdict(opt.id)}
                  style={[
                    styles.verdictOptionBtn,
                    isSelected && styles.verdictOptionSelected,
                  ]}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                  <Text
                    style={[
                      styles.verdictOptionText,
                      isSelected && styles.verdictOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Actions Footer */}
        <View style={styles.actionButtonsCol}>
          <Button
            title="Emitir Fallo y Actualizar Tabla"
            onPress={handleIssueVerdict}
            variant="primary"
            icon={<MaterialIcons name="gavel" size={20} color={Colors.onPrimary} />}
            disabled={verdictIssued}
          />

          <Button
            title="Solicitar más pruebas a los jugadores"
            onPress={() => router.back()}
            variant="secondary"
            icon={<MaterialIcons name="mail-outline" size={18} color={Colors.textPrimary} />}
          />
        </View>
      </ScrollView>

      {/* Fullscreen Zoom Modal */}
      {zoomImage && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setZoomImage(null)}
        >
          <View style={styles.zoomModalBackdrop}>
            <View style={styles.zoomModalHeader}>
              <Text style={styles.zoomModalTitle}>Inspección de Prueba VAR</Text>
              <Pressable onPress={() => setZoomImage(null)} style={styles.zoomCloseBtn}>
                <MaterialIcons name="close" size={24} color="#FFF" />
              </Pressable>
            </View>
            <View style={styles.zoomImageContainer}>
              <Image
                source={{ uri: zoomImage }}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Modal>
      )}
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
    gap: 14,
  },
  caseBadge: {
    alignSelf: 'center',
  },
  verdictToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  verdictToastText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onPrimary,
    flex: 1,
  },
  summaryCard: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#0F141D',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  scoresCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  scoreCompareBox: {
    flex: 1,
    backgroundColor: Colors.surfaceLow,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreCompareLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  scoreCompareVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 2,
  },
  vsDivider: {
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  testimonyCard: {
    padding: 12,
    gap: 6,
  },
  testimonyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  captainBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  claimTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  claimBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  evidenceGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  evidenceBox: {
    flex: 1,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  evidenceImg: {
    width: '100%',
    height: '100%',
  },
  evidenceTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evidenceTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  verdictCard: {
    padding: 14,
    gap: 12,
  },
  verdictHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verdictHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verdictOptionsCol: {
    gap: 8,
  },
  verdictOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLow,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  verdictOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(184, 255, 44, 0.08)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  verdictOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  verdictOptionTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 4,
  },
  zoomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
  },
  zoomModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  zoomModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  zoomCloseBtn: {
    padding: 6,
  },
  zoomImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
});
