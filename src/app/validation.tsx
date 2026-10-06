import * as ImagePicker from 'expo-image-picker';
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

const EVIDENCE_PRESETS = [
  {
    id: 'stats',
    label: '📊 Estadísticas EA FC',
    uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
  },
  {
    id: 'final',
    label: '⏱️ Pitido Final 90\'',
    uri: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
  },
  {
    id: 'radar',
    label: '🎯 Rendimiento Jugadores',
    uri: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
  },
];

export default function ValidationScreen() {
  const insets = useSafeAreaInsets();
  const { liveMatch, submitResultProposal, respondToResultProposal, refreshStandings, gamerTag } = useTournament();
  const [agreed, setAgreed] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceUri, setEvidenceUri] = useState<string>(EVIDENCE_PRESETS[0].uri);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [rivalAgreed, setRivalAgreed] = useState(true);

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEvidenceUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error al abrir galería:', e);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitResultProposal(liveMatch.homeScore, liveMatch.awayScore, evidenceUri);
      if (res && res.proposal_id) {
        await respondToResultProposal(res.proposal_id, rivalAgreed);
      }
      if (rivalAgreed) {
        await refreshStandings();
        setConfirmed(true);
        setTimeout(() => {
          router.replace('/(tabs)/standings');
        }, 1500);
      } else {
        router.push('/dispute');
      }
    } catch (e) {
      console.warn('Error al enviar propuesta de resultado:', e);
    }
    setIsSubmitting(false);
  };

  const handleOpenDispute = () => {
    router.push('/dispute');
  };

  return (
    <View style={styles.container}>
      <Header
        title="Validación De Resultado"
        subtitle={`ACTA OFICIAL DE PARTIDO • JORNADA ${liveMatch.matchday || 6}`}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <Badge
          label={
            confirmed
              ? "ACTA HOMOLOGADA POR AMBOS CLUBES"
              : "VALIDACIÓN PENDIENTE • REVISIÓN DE CONFORMIDAD"
          }
          variant={confirmed ? "lime" : "cyan"}
          size="md"
          pulse={!confirmed}
          style={styles.statusBadge}
        />

        {/* Confirmation Toast */}
        {confirmed && (
          <View style={styles.confirmedToast}>
            <MaterialIcons name="verified" size={22} color={Colors.onPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.confirmedToastTitle}>¡Acta Homologada con Éxito!</Text>
              <Text style={styles.confirmedToastText}>
                Se han acreditado los puntos oficiales en la tabla de clasificación general.
              </Text>
            </View>
          </View>
        )}

        {/* Reported Score Overview Card */}
        <Card variant="active" style={styles.scoreOverviewCard}>
          <Text style={styles.reportedLabel}>MARCADOR FINAL REGISTRADO</Text>

          <View style={styles.scoreRow}>
            {/* Local Team */}
            <View style={styles.teamCol}>
              <View style={styles.crestCircle}>
                <Text style={styles.crestCode}>{liveMatch.homeTeam.shortName}</Text>
              </View>
              <Text style={styles.teamTitle}>{liveMatch.homeTeam.name}</Text>
              <Text style={styles.sideLabel}>LOCAL (TÚ)</Text>
            </View>

            {/* Score */}
            <View style={styles.scoreDigitsCol}>
              <Text style={styles.scoreDigit}>{liveMatch.homeScore}</Text>
              <Text style={styles.scoreColon}>-</Text>
              <Text style={styles.scoreDigit}>{liveMatch.awayScore}</Text>
            </View>

            {/* Visitor Team */}
            <View style={styles.teamCol}>
              <View style={[styles.crestCircle, { borderColor: Colors.secondary }]}>
                <Text style={styles.crestCode}>{liveMatch.awayTeam.shortName}</Text>
              </View>
              <Text style={styles.teamTitle}>{liveMatch.awayTeam.name}</Text>
              <Text style={styles.sideLabel}>VISITANTE</Text>
            </View>
          </View>

          {/* Rival Captain Conformity Status Strip */}
          <Pressable
            onPress={() => setRivalAgreed(!rivalAgreed)}
            style={styles.rivalStatusStrip}
          >
            <MaterialIcons
              name={rivalAgreed ? "check-circle" : "error-outline"}
              size={16}
              color={rivalAgreed ? Colors.primary : Colors.warning}
            />
            <Text style={styles.rivalStatusText}>
              Capitán rival ({liveMatch.awayTeam.name}): {rivalAgreed ? 'Conforme con el acta' : 'Discrepa con el acta (Reclama VAR)'}
            </Text>
          </Pressable>
        </Card>

        {/* Evidence Photo Screenshot */}
        <Card variant="surface" style={styles.proofCard}>
          <View style={styles.proofHeader}>
            <View style={styles.proofTitleRow}>
              <MaterialIcons name="camera-alt" size={18} color={Colors.primary} />
              <Text style={styles.proofTitle}>Comprobante Visual Obligatorio</Text>
            </View>
            <Badge label="VERIFICADA" variant="lime" size="sm" />
          </View>

          {/* Clickable Image to Zoom */}
          <Pressable onPress={() => setZoomVisible(true)} style={styles.imageWrapper}>
            <Image
              source={{ uri: evidenceUri }}
              style={styles.proofImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlayTag}>
              <MaterialIcons name="tv" size={14} color="#FFF" />
              <Text style={styles.imageOverlayText}>EA FC 25 • Final Match Stats</Text>
            </View>
            <View style={styles.zoomHintTag}>
              <MaterialIcons name="zoom-in" size={16} color="#FFF" />
              <Text style={styles.zoomHintText}>Tocar para ampliar</Text>
            </View>
          </Pressable>

          {/* Presets and Gallery Button */}
          <View style={styles.presetsRow}>
            {EVIDENCE_PRESETS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setEvidenceUri(p.uri)}
                style={[
                  styles.presetChip,
                  evidenceUri === p.uri && styles.presetChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    evidenceUri === p.uri && styles.presetChipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}

            <Pressable onPress={handlePickFromGallery} style={styles.galleryBtn}>
              <MaterialIcons name="add-photo-alternate" size={16} color={Colors.secondary} />
              <Text style={styles.galleryBtnText}>Galería</Text>
            </Pressable>
          </View>

          <Text style={styles.proofMeta}>
            Firma digital calculada: SHA-256 #ACTA-{liveMatch.id.slice(0, 8)}-2026
          </Text>
        </Card>

        {/* Reported Events Breakdown */}
        <View style={styles.eventsBreakdown}>
          <Text style={styles.sectionTitle}>ACTA DE INCIDENCIAS CONFIRMADAS</Text>

          <View style={styles.eventsCard}>
            {liveMatch.events.length === 0 ? (
              <Text style={styles.noEventsText}>No se registraron tarjetas ni goles en este encuentro.</Text>
            ) : (
              liveMatch.events.map((evt) => (
                <View key={evt.id} style={styles.eventRow}>
                  <View style={styles.eventMinBadge}>
                    <Text style={styles.eventMinText}>{evt.minute}</Text>
                  </View>
                  <View style={styles.eventIconSmall}>
                    {evt.type === 'goal' && <Text style={{ fontSize: 14 }}>⚽</Text>}
                    {evt.type === 'yellow_card' && <View style={styles.yellowCardIcon} />}
                    {evt.type === 'red_card' && <View style={styles.redCardIcon} />}
                  </View>
                  <View style={styles.eventDetailsCol}>
                    <Text style={styles.eventPlayerName}>{evt.playerName}</Text>
                    <Text style={styles.eventDescText}>{evt.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.teamTagSmall,
                      evt.team === 'home' ? styles.teamTagHome : styles.teamTagAway,
                    ]}
                  >
                    <Text
                      style={[
                        styles.teamTagSmallText,
                        evt.team === 'home' ? styles.teamTagTextHome : styles.teamTagTextAway,
                      ]}
                    >
                      {evt.team === 'home' ? liveMatch.homeTeam.shortName : liveMatch.awayTeam.shortName}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Agreement Checkbox */}
        <Card variant="low" style={styles.agreementCard}>
          <Pressable
            onPress={() => setAgreed(!agreed)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <MaterialIcons name="check" size={14} color={Colors.onPrimary} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.agreementText}>
                Declaración de Conformidad Federada: Certifico que el marcador ({liveMatch.homeScore} - {liveMatch.awayScore}) y las incidencias coinciden con la partida oficial en EA FC 25.
              </Text>
              <Text style={styles.signerSub}>Capitán Firmante: {gamerTag}</Text>
            </View>
          </Pressable>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsCol}>
          <Button
            title={isSubmitting ? "Homologando Acta..." : "Firmar y Confirmar Resultado"}
            onPress={handleConfirm}
            variant="primary"
            icon={<MaterialIcons name="check-circle" size={20} color={Colors.onPrimary} />}
            disabled={!agreed || confirmed || isSubmitting}
          />

          <Button
            title="Rechazar y Abrir Disputa VAR"
            onPress={handleOpenDispute}
            variant="danger"
            icon={<MaterialIcons name="gavel" size={18} color="#FFF" />}
            disabled={confirmed}
          />
        </View>
      </ScrollView>

      {/* Fullscreen Zoom Modal for Evidence Inspection */}
      <Modal
        visible={zoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomVisible(false)}
      >
        <View style={styles.zoomModalBackdrop}>
          <View style={styles.zoomModalHeader}>
            <Text style={styles.zoomModalTitle}>Comprobante Oficial de Partido</Text>
            <Pressable onPress={() => setZoomVisible(false)} style={styles.zoomCloseBtn}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </Pressable>
          </View>
          <View style={styles.zoomImageContainer}>
            <Image
              source={{ uri: evidenceUri }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  statusBadge: {
    alignSelf: 'center',
  },
  confirmedToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  confirmedToastText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onPrimary,
    flex: 1,
  },
  scoreOverviewCard: {
    backgroundColor: '#0F151F',
    padding: 16,
    alignItems: 'center',
  },
  reportedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  crestCircle: {
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
  teamTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sideLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  scoreDigitsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreDigit: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.primary,
  },
  scoreColon: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  proofCard: {
    padding: 14,
    gap: 10,
  },
  proofHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proofTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proofTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  proofMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  eventsBreakdown: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  eventsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    gap: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 48, 61, 0.4)',
  },
  eventMinBadge: {
    width: 32,
    height: 22,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMinText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
  },
  eventDetailsCol: {
    flex: 1,
  },
  eventPlayerName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  eventDescText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  agreementCard: {
    padding: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  agreementText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actionsCol: {
    gap: 10,
    marginTop: 4,
  },
  confirmedToastTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.onPrimary,
  },
  rivalStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: '100%',
    justifyContent: 'center',
  },
  rivalStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  zoomHintTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoomHintText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(184, 255, 44, 0.12)',
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  presetChipTextActive: {
    color: Colors.primary,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  galleryBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondary,
  },
  noEventsText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  eventIconSmall: {
    width: 20,
    alignItems: 'center',
  },
  yellowCardIcon: {
    width: 10,
    height: 14,
    backgroundColor: Colors.warning,
    borderRadius: 2,
  },
  redCardIcon: {
    width: 10,
    height: 14,
    backgroundColor: Colors.danger,
    borderRadius: 2,
  },
  teamTagSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  teamTagHome: {
    backgroundColor: 'rgba(184, 255, 44, 0.1)',
    borderColor: Colors.primary,
  },
  teamTagAway: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: Colors.secondary,
  },
  teamTagSmallText: {
    fontSize: 8,
    fontWeight: '800',
  },
  teamTagTextHome: {
    color: Colors.primary,
  },
  teamTagTextAway: {
    color: Colors.secondary,
  },
  signerSub: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
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
