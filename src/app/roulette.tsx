import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Header } from '../components/common/Header';
import { RouletteWheel } from '../components/roulette/RouletteWheel';
import { Colors } from '../constants/theme';
import { useTournament } from '../features/tournament/TournamentContext';
import { Club } from '../types/tournament';

export default function RouletteScreen() {
  const insets = useSafeAreaInsets();
  const { assignedClub, setAssignedClub } = useTournament();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const handleClubSelected = (club: Club) => {
    setSelectedClub(club);
    setAssignedClub(club);
    // Transición suave a la pantalla de Club Asignado
    setTimeout(() => {
      router.push('/assigned-club');
    }, 1100);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Ruleta de Clubes"
        subtitle="Sorteo Oficial de Franquicias"
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle / Counter Row */}
        <View style={styles.metaRow}>
          <Badge label="25 CLUBES LICENCIADOS" variant="lime" size="sm" />
          <Badge label="1 ASIGNACIÓN DEFINITIVA" variant="cyan" size="sm" />
        </View>

        <Text style={styles.headlineText}>
          Gira para descubrir tu club de la temporada
        </Text>
        <Text style={styles.subheadlineText}>
          Algoritmo federado certificado con probabilidades equitativas de plantilla élite y bloqueo atómico.
        </Text>

        {/* Existing Club Notification if already assigned */}
        {assignedClub && (
          <Card variant="low" style={styles.existingClubCard}>
            <View style={styles.existingClubHeader}>
              <MaterialCommunityIcons name="shield-check" size={20} color={Colors.primary} />
              <Text style={styles.existingClubTitle}>Club Asignado: {assignedClub.name}</Text>
            </View>
            <Text style={styles.existingClubBody}>
              Ya cuentas con una escuadra oficial registrada para este torneo.
            </Text>
            <Button
              title="Ver Mi Plantilla Oficial"
              onPress={() => router.push('/assigned-club')}
              variant="outline"
              fullWidth={false}
              icon={<MaterialIcons name="groups" size={16} color={Colors.primary} />}
              style={styles.viewExistingBtn}
            />
          </Card>
        )}

        {/* Animated Interactive Roulette Wheel */}
        <View style={styles.wheelWrapper}>
          <RouletteWheel onClubSelected={handleClubSelected} />
        </View>

        {/* Selected Result Box if spun */}
        {selectedClub && (
          <Card variant="active" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialIcons name="stars" size={24} color={Colors.primary} />
              <Text style={styles.resultTitle}>¡CLUB SORTEADO: {selectedClub.name}!</Text>
            </View>
            <Text style={styles.resultSub}>
              Cargando estadísticas de plantilla oficial y química táctica...
            </Text>
          </Card>
        )}

        {/* Rules & Fair Play Card */}
        <Card variant="low" style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <MaterialCommunityIcons name="shield-check" size={20} color={Colors.secondary} />
            <Text style={styles.rulesTitle}>Reglamento de Sorteo Federado</Text>
          </View>
          <Text style={styles.rulesBody}>
            • Cada participante recibe una escuadra sin posibilidad de intercambios manuales.
          </Text>
          <Text style={styles.rulesBody}>
            • Se respeta el rating EA FC 25 oficial actualizado a la fecha de la competición.
          </Text>
          <Text style={styles.rulesBody}>
            • Los ajustes tácticos y alineaciones titulares podrán configurarse libremente.
          </Text>
        </Card>

        {/* Manual Direct Access Button */}
        <Button
          title="Ver Plantilla Asignada"
          onPress={() => router.push('/assigned-club')}
          variant="secondary"
          icon={<MaterialIcons name="arrow-forward" size={18} color={Colors.textPrimary} />}
          style={styles.continueBtn}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  headlineText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subheadlineText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  existingClubCard: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
    borderColor: 'rgba(184, 255, 44, 0.3)',
  },
  existingClubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  existingClubTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  existingClubBody: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  viewExistingBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  wheelWrapper: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    width: '100%',
    marginVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  resultSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rulesCard: {
    width: '100%',
    marginVertical: 12,
    padding: 14,
    gap: 6,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  rulesBody: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  continueBtn: {
    width: '100%',
    marginTop: 10,
  },
});
