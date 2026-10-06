import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useTournament } from '../../features/tournament/TournamentContext';
import { Club } from '../../types/tournament';

const DEFAULT_WHEEL_CLUBS: Club[] = [
  { id: 'mci', name: 'Manchester City', shortName: 'MCI', color: '#6CABDD', accentColor: '#B8FF2C', rating: 86, attack: 88, defense: 85, chemistry: 33, league: 'Premier League' },
  { id: 'rma', name: 'Real Madrid', shortName: 'RMA', color: '#EEEEEF', accentColor: '#FEBE10', rating: 87, attack: 89, defense: 85, chemistry: 33, league: 'LaLiga' },
  { id: 'bay', name: 'Bayern Múnich', shortName: 'BAY', color: '#DC052D', accentColor: '#0066B2', rating: 86, attack: 88, defense: 84, chemistry: 33, league: 'Bundesliga' },
  { id: 'bar', name: 'FC Barcelona', shortName: 'BAR', color: '#A50044', accentColor: '#004D98', rating: 85, attack: 86, defense: 83, chemistry: 33, league: 'LaLiga' },
  { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', color: '#004170', accentColor: '#DA291C', rating: 85, attack: 87, defense: 83, chemistry: 33, league: 'Ligue 1' },
  { id: 'liv', name: 'Liverpool FC', shortName: 'LIV', color: '#C8102E', accentColor: '#F6B93B', rating: 85, attack: 86, defense: 84, chemistry: 33, league: 'Premier League' },
  { id: 'int', name: 'Inter de Milán', shortName: 'INT', color: '#001489', accentColor: '#B8FF2C', rating: 85, attack: 86, defense: 85, chemistry: 33, league: 'Serie A' },
  { id: 'ars', name: 'Arsenal FC', shortName: 'ARS', color: '#EF0107', accentColor: '#22D3EE', rating: 85, attack: 85, defense: 85, chemistry: 33, league: 'Premier League' },
  { id: 'b04', name: 'Bayer Leverkusen', shortName: 'B04', color: '#E32221', accentColor: '#000000', rating: 84, attack: 85, defense: 83, chemistry: 33, league: 'Bundesliga' },
  { id: 'juv', name: 'Juventus FC', shortName: 'JUV', color: '#000000', accentColor: '#FFFFFF', rating: 83, attack: 83, defense: 83, chemistry: 33, league: 'Serie A' },
  { id: 'atm', name: 'Atlético de Madrid', shortName: 'ATM', color: '#CB3524', accentColor: '#22D3EE', rating: 83, attack: 84, defense: 83, chemistry: 33, league: 'LaLiga' },
  { id: 'mil', name: 'AC Milan', shortName: 'MIL', color: '#FB090B', accentColor: '#000000', rating: 83, attack: 84, defense: 82, chemistry: 33, league: 'Serie A' },
];

interface RouletteWheelProps {
  onClubSelected: (club: Club) => void;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({ onClubSelected }) => {
  const { spinAndAssignClub } = useTournament();
  const [spinning, setSpinning] = useState(false);
  const [wheelClubs, setWheelClubs] = useState<Club[]>(DEFAULT_WHEEL_CLUBS);
  const [spinAnim] = useState(() => new Animated.Value(0));

  const numItems = wheelClubs.length;
  const anglePerItem = 360 / numItems;

  const startSpin = async () => {
    if (spinning) return;
    setSpinning(true);

    let targetIndex = 0;
    let selectedClub = wheelClubs[0];

    try {
      const assigned = await spinAndAssignClub();
      if (assigned) {
        selectedClub = assigned;
        let found = wheelClubs.findIndex(
          (c) =>
            c.shortName.toLowerCase() === assigned.shortName.toLowerCase() ||
            c.name.toLowerCase() === assigned.name.toLowerCase()
        );

        if (found < 0) {
          // Si el club no está en los 12 por defecto, insertarlo en la posición 0
          found = 0;
          setWheelClubs((prev) => [assigned, ...prev.slice(1)]);
        }
        targetIndex = found;
      } else {
        targetIndex = Math.floor(Math.random() * numItems);
        selectedClub = wheelClubs[targetIndex];
      }
    } catch {
      targetIndex = 0;
      selectedClub = wheelClubs[0];
    }

    const fullRotations = 5;
    const finalAngle = fullRotations * 360 + (360 - targetIndex * anglePerItem);

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: finalAngle,
      duration: 3800,
      easing: Easing.bezier(0.15, 0.9, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      onClubSelected(selectedClub);
    });
  };

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Outer Glow Halo */}
      <View style={styles.glowRing} />

      {/* Center Fixed Arrow / Needle */}
      <View style={styles.pointerContainer}>
        <View style={styles.pointerNeedle} />
      </View>

      {/* Rotating Wheel Disk */}
      <Animated.View
        style={[
          styles.wheelDisk,
          {
            transform: [{ rotate: spinInterpolation }],
          },
        ]}
      >
        {wheelClubs.map((club, index) => {
          const angle = index * anglePerItem;
          return (
            <View
              key={`${club.id}-${index}`}
              style={[
                styles.sliceSegment,
                {
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: -110 },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.clubBadgePill,
                  club.accentColor ? { borderColor: club.accentColor } : null,
                ]}
              >
                <Text style={styles.clubShortCode}>{club.shortName}</Text>
                <Text style={styles.clubRatingText}>{club.rating}</Text>
              </View>
            </View>
          );
        })}
      </Animated.View>

      {/* Central Interactive Hub */}
      <Pressable
        onPress={startSpin}
        disabled={spinning}
        style={({ pressed }) => [
          styles.centerHub,
          pressed && !spinning && styles.hubPressed,
        ]}
      >
        <View style={styles.innerHubCircle}>
          <MaterialIcons
            name={spinning ? 'autorenew' : 'sports-soccer'}
            size={28}
            color={spinning ? Colors.secondary : Colors.primary}
          />
          <Text style={styles.hubTitleText}>
            {spinning ? 'GIRANDO...' : 'TAP TO SPIN'}
          </Text>
          <Text style={styles.hubSubText}>5 LIGAS</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 16,
  },
  glowRing: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 2,
    borderColor: 'rgba(184, 255, 44, 0.25)',
    backgroundColor: 'rgba(18, 24, 33, 0.6)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  pointerContainer: {
    position: 'absolute',
    top: 6,
    zIndex: 99,
    alignItems: 'center',
  },
  pointerNeedle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  wheelDisk: {
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#0D131C',
    borderWidth: 3,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sliceSegment: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 44,
    height: 140,
  },
  clubBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  clubShortCode: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  clubRatingText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  centerHub: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#080B10',
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 50,
  },
  hubPressed: {
    transform: [{ scale: 0.96 }],
  },
  innerHubCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  hubTitleText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  hubSubText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
