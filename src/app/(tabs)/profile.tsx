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
import { Colors } from '../../constants/theme';
import { useTournament } from '../../features/tournament/TournamentContext';

import { useAuthStore } from '../../stores/useAuthStore';

export default function ProfileScreen() {
  const { gamerTag, assignedClub, logout, standings } = useTournament();
  const { profile } = useAuthStore();

  const userRow = standings.find((s) => s.isUserClub) || standings[1] || {
    played: 7,
    goalsFor: 16,
    won: 5,
  };

  const winRate = userRow.played > 0
    ? Math.round((userRow.won / userRow.played) * 100)
    : 71;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Header title="Perfil" subtitle="LICENCIA FEDERADA EA FC 25" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Captain Identity Card */}
        <Card variant="active" style={styles.captainCard}>
          <View style={styles.captainTop}>
            <View style={styles.avatarBorder}>
              <MaterialCommunityIcons name="shield-account" size={36} color={Colors.primary} />
            </View>
            <View style={styles.captainInfo}>
              <Text style={styles.gamerTagText}>{gamerTag}</Text>
              <Text style={styles.captainRole}>CAPITÁN TITULAR • EA FC PRO</Text>
              <View style={styles.badgeRow}>
                <Badge label={`ID: FED-${userRow.position || 2}882`} variant="cyan" size="sm" />
                <Badge label="DIVISIÓN ÉLITE" variant="lime" size="sm" />
              </View>
            </View>
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statDigit}>{userRow.played}</Text>
              <Text style={styles.statDesc}>PARTIDOS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statDigit, { color: Colors.primary }]}>{userRow.goalsFor}</Text>
              <Text style={styles.statDesc}>GOLES</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statDigit}>{winRate}%</Text>
              <Text style={styles.statDesc}>VICTORIAS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statDigit, { color: Colors.secondary }]}>98%</Text>
              <Text style={styles.statDesc}>FAIR PLAY</Text>
            </View>
          </View>
        </Card>

        {/* Assigned Club Details Card */}
        <Card variant="surface" style={styles.assignedCard}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="sports-soccer" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Club Oficial de la Temporada</Text>
          </View>
          <View style={styles.clubRow}>
            <View style={styles.clubCrestBox}>
              <Text style={styles.clubCrestText}>{assignedClub.shortName}</Text>
            </View>
            <View style={styles.clubDetailCol}>
              <Text style={styles.clubName}>{assignedClub.name}</Text>
              <Text style={styles.clubLeague}>{assignedClub.league} • Plantilla Oficial</Text>
            </View>
            <Pressable
              onPress={() => router.push('/roulette')}
              style={styles.reSpinBtn}
            >
              <MaterialCommunityIcons name="slot-machine-outline" size={16} color={Colors.secondary} />
              <Text style={styles.reSpinText}>Ruleta</Text>
            </Pressable>
          </View>
        </Card>

        {/* Console / Platform Link Status */}
        <Card variant="surface" style={styles.platformCard}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="gamepad-variant" size={20} color={Colors.secondary} />
            <Text style={styles.cardTitle}>Plataforma Vinculada</Text>
          </View>
          <View style={styles.platformRow}>
            <View style={styles.platformIconWrap}>
              <MaterialCommunityIcons name="sony-playstation" size={24} color={Colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.platformName}>PlayStation Network (PS5)</Text>
              <Text style={styles.platformTag}>
                Online ID: {profile?.gamer_tag || gamerTag}
              </Text>
            </View>
            <Badge label="CONECTADO" variant="lime" size="sm" />
          </View>
        </Card>

        {/* Tournament Rules / Help */}
        <Card variant="low" style={styles.infoCard}>
          <View style={styles.cardTitleRow}>
            <MaterialIcons name="policy" size={20} color={Colors.textSecondary} />
            <Text style={styles.cardTitle}>Reglamento Oficial del Torneo</Text>
          </View>
          <Text style={styles.infoBody}>
            • Partidos de 6 minutos por parte con velocidad Normal.
          </Text>
          <Text style={styles.infoBody}>
            • Obligatorio enviar fotografía de la pantalla de fin de partido con estadísticas.
          </Text>
          <Text style={styles.infoBody}>
            • En caso de desconexión antes del minuto 80, se reanudan los minutos restantes.
          </Text>
        </Card>

        {/* Admin / Organizer Access */}
        <Button
          title="Panel de Control del Torneo"
          onPress={() => router.push('/admin')}
          variant="secondary"
          icon={<MaterialIcons name="admin-panel-settings" size={18} color={Colors.primary} />}
        />

        {/* Logout CTA */}
        <Button
          title="Cerrar Sesión Federada"
          onPress={handleLogout}
          variant="danger"
          icon={<MaterialIcons name="logout" size={18} color="#FFF" />}
          style={styles.logoutBtn}
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
    gap: 14,
  },
  captainCard: {
    padding: 16,
  },
  captainTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captainInfo: {
    flex: 1,
    gap: 4,
  },
  gamerTagText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  captainRole: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBox: {
    alignItems: 'center',
  },
  statDigit: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statDesc: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
  },
  assignedCard: {
    padding: 14,
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubCrestBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubCrestText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  clubDetailCol: {
    flex: 1,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clubLeague: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reSpinBtn: {
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
  reSpinText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
  },
  platformCard: {
    padding: 14,
    gap: 10,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  platformTag: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    padding: 14,
    gap: 6,
  },
  infoBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  logoutBtn: {
    marginTop: 8,
  },
});
