import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Header } from '../../components/common/Header';
import { SoccerPitch } from '../../components/tactics/SoccerPitch';
import { Colors } from '../../constants/theme';
import { getFallbackSquad } from '../../data/scrapedData';
import { useTournament } from '../../features/tournament/TournamentContext';
import { Formation } from '../../types/tournament';
import { tacticsService } from '../../services/tactics.service';

export default function TacticsScreen() {
  const {
    squad,
    selectedFormation,
    setFormation,
    pitchWidth,
    setPitchWidth,
    pitchDepth,
    setPitchDepth,
    selectedPlayer,
    setSelectedPlayer,
    updatePlayerPosition,
    assignedClub,
  } = useTournament();

  const [showBench, setShowBench] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Banquillo dinámico según el club asignado
  const fallbackSquad = getFallbackSquad(assignedClub.id || assignedClub.name);
  const benchPlayers =
    squad.length > 11
      ? squad.slice(11)
      : fallbackSquad.slice(11).map((p, idx) => ({
          id: p.id,
          name: p.name,
          number: p.shirt_number || 12 + idx,
          position: p.position,
          rating: p.rating,
        }));

  const formations: Formation[] = [
    '4-3-3 Ofensiva',
    '4-2-3-1 Cerrada',
    '4-4-2 Rombo',
    '3-5-2 Directa',
  ];

  const handleSaveTactics = async () => {
    setSaveSuccess(true);
    try {
      const positions = squad.map((p) => ({
        playerId: p.id,
        x: (p.x || 50) / 100, // Normalized 0..1
        y: (p.y || 50) / 100, // Normalized 0..1
        isStarter: p.isStarter !== false,
      }));
      await tacticsService.savePositions(assignedClub.id, positions);
    } catch (e) {
      console.warn('Error al guardar táctica en backend:', e);
    }
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Pizarra Táctica"
        subtitle={`${assignedClub.name} • QUÍMICA 33/33`}
        rightAction={
          <Pressable onPress={handleSaveTactics} style={styles.headerSaveBtn}>
            <MaterialIcons name="save" size={18} color={Colors.onPrimary} />
            <Text style={styles.headerSaveText}>Guardar</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Save confirmation toast */}
        {saveSuccess && (
          <View style={styles.saveToast}>
            <MaterialIcons name="check-circle" size={18} color={Colors.onPrimary} />
            <Text style={styles.saveToastText}>
              ¡Esquema táctico y roles sincronizados para el partido!
            </Text>
          </View>
        )}

        {/* Formation Chips Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.formationsScroll}
        >
          {formations.map((f) => {
            const isSelected = selectedFormation === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFormation(f)}
                style={[
                  styles.formationChip,
                  isSelected && styles.formationChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.formationChipText,
                    isSelected && styles.formationChipTextSelected,
                  ]}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Interactive Tactical Pitch */}
        <View style={styles.pitchSection}>
          <SoccerPitch
            players={squad}
            selectedPlayer={selectedPlayer}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
            onMovePlayer={updatePlayerPosition}
          />
        </View>

        {/* Selected Player Details Card */}
        {selectedPlayer && (
          <Card variant="active" style={styles.playerDetailCard}>
            <View style={styles.playerDetailHeader}>
              <View style={styles.playerNumberBox}>
                <Text style={styles.playerNumberDigit}>{selectedPlayer.number}</Text>
              </View>

              <View style={styles.playerTitleCol}>
                <Text style={styles.playerDetailName}>{selectedPlayer.name}</Text>
                <Text style={styles.playerDetailRole}>
                  {selectedPlayer.position} • {selectedPlayer.role || 'Instrucción Estándar'}
                </Text>
              </View>

              <View style={styles.ratingBadge}>
                <Text style={styles.ratingDigit}>{selectedPlayer.rating}</Text>
                <Text style={styles.ratingOvr}>OVR</Text>
              </View>
            </View>

            <View style={styles.playerInstructionsRow}>
              <View style={styles.instructionPill}>
                <Text style={styles.instructionLabel}>Desmarques</Text>
                <Text style={styles.instructionValue}>Hacia Adentro</Text>
              </View>
              <View style={styles.instructionPill}>
                <Text style={styles.instructionLabel}>Presión</Text>
                <Text style={styles.instructionValue}>Agresiva</Text>
              </View>
              <View style={styles.instructionPill}>
                <Text style={styles.instructionLabel}>Apoyos</Text>
                <Text style={styles.instructionValue}>Al Pie</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Tactical Sliders / Settings */}
        <Card variant="surface" style={styles.slidersCard}>
          <Text style={styles.cardHeaderTitle}>DIRECTRICES DE EQUIPO</Text>

          {/* Width Slider */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderLabelCol}>
              <Text style={styles.sliderLabel}>Anchura de Campo</Text>
              <Text style={styles.sliderPercent}>{pitchWidth}%</Text>
            </View>
            <View style={styles.sliderControls}>
              <Pressable
                onPress={() => setPitchWidth(Math.max(40, pitchWidth - 5))}
                style={styles.stepBtn}
              >
                <MaterialIcons name="remove" size={18} color={Colors.textPrimary} />
              </Pressable>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${pitchWidth}%` }]} />
              </View>
              <Pressable
                onPress={() => setPitchWidth(Math.min(100, pitchWidth + 5))}
                style={styles.stepBtn}
              >
                <MaterialIcons name="add" size={18} color={Colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Depth Slider */}
          <View style={styles.sliderRow}>
            <View style={styles.sliderLabelCol}>
              <Text style={styles.sliderLabel}>Profundidad Defensiva</Text>
              <Text style={styles.sliderPercent}>{pitchDepth}%</Text>
            </View>
            <View style={styles.sliderControls}>
              <Pressable
                onPress={() => setPitchDepth(Math.max(40, pitchDepth - 5))}
                style={styles.stepBtn}
              >
                <MaterialIcons name="remove" size={18} color={Colors.textPrimary} />
              </Pressable>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${pitchDepth}%`, backgroundColor: Colors.secondary },
                  ]}
                />
              </View>
              <Pressable
                onPress={() => setPitchDepth(Math.min(100, pitchDepth + 5))}
                style={styles.stepBtn}
              >
                <MaterialIcons name="add" size={18} color={Colors.textPrimary} />
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Bench Toggle & List */}
        <View style={styles.benchSection}>
          <Pressable
            onPress={() => setShowBench(!showBench)}
            style={styles.benchToggleBtn}
          >
            <View style={styles.benchToggleLeft}>
              <MaterialCommunityIcons name="account-group" size={20} color={Colors.primary} />
              <Text style={styles.benchToggleText}>
                Banquillo de Suplentes ({benchPlayers.length})
              </Text>
            </View>
            <MaterialIcons
              name={showBench ? 'expand-less' : 'expand-more'}
              size={24}
              color={Colors.textSecondary}
            />
          </Pressable>

          {showBench && (
            <View style={styles.benchList}>
              {benchPlayers.map((sub) => (
                <View key={sub.id} style={styles.benchItem}>
                  <View style={styles.benchNumberWrap}>
                    <Text style={styles.benchNumber}>{sub.number}</Text>
                  </View>
                  <View style={styles.benchInfo}>
                    <Text style={styles.benchName}>{sub.name}</Text>
                    <Text style={styles.benchPos}>{sub.position}</Text>
                  </View>
                  <View style={styles.benchRatingWrap}>
                    <Text style={styles.benchRating}>{sub.rating}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Save Action */}
        <Button
          title="Guardar Formación Oficial"
          onPress={handleSaveTactics}
          variant="primary"
          icon={<MaterialIcons name="check-circle" size={20} color={Colors.onPrimary} />}
          style={styles.saveActionBtn}
        />
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
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  saveToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  saveToastText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onPrimary,
    flex: 1,
  },
  formationsScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  formationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formationChipSelected: {
    backgroundColor: 'rgba(184, 255, 44, 0.12)',
    borderColor: Colors.primary,
  },
  formationChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  formationChipTextSelected: {
    color: Colors.primary,
  },
  pitchSection: {
    marginBottom: 16,
  },
  playerDetailCard: {
    marginBottom: 16,
  },
  playerDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  playerNumberBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumberDigit: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.onPrimary,
  },
  playerTitleCol: {
    flex: 1,
  },
  playerDetailName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  playerDetailRole: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 2,
  },
  ratingBadge: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingDigit: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  ratingOvr: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  playerInstructionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  instructionPill: {
    flex: 1,
    backgroundColor: Colors.surfaceLow,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  instructionValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  slidersCard: {
    marginBottom: 16,
    gap: 14,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  sliderRow: {
    gap: 6,
  },
  sliderLabelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sliderPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLow,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceLow,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  benchSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  benchToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  benchToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benchToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  benchList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  benchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 48, 61, 0.4)',
    gap: 12,
  },
  benchNumberWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benchNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  benchInfo: {
    flex: 1,
  },
  benchName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  benchPos: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  benchRatingWrap: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  benchRating: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
  },
  saveActionBtn: {
    marginTop: 4,
  },
});
