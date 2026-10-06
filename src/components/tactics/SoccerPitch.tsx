import React, { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { Player } from '../../types/tournament';

interface SoccerPitchProps {
  players: Player[];
  selectedPlayer: Player | null;
  onSelectPlayer: (p: Player) => void;
  onMovePlayer?: (playerId: string, newX: number, newY: number) => void;
}

interface DraggablePinProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
  onMove?: (x: number, y: number) => void;
  pitchDims: { width: number; height: number };
}

const DraggablePin: React.FC<DraggablePinProps> = ({
  player,
  isSelected,
  onSelect,
  onMove,
  pitchDims,
}) => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
        onPanResponderGrant: () => {
          setDragOffset({ x: 0, y: 0 });
          onSelect();
        },
        onPanResponderMove: (_, gesture) => {
          if (pitchDims.width > 0 && pitchDims.height > 0) {
            setDragOffset({
              x: (gesture.dx / pitchDims.width) * 100,
              y: (gesture.dy / pitchDims.height) * 100,
            });
          }
        },
        onPanResponderRelease: (_, gesture) => {
          const didMove = Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
          if (didMove && onMove && pitchDims.width > 0 && pitchDims.height > 0) {
            const finalX = Math.min(92, Math.max(8, player.x + (gesture.dx / pitchDims.width) * 100));
            const finalY = Math.min(94, Math.max(6, player.y + (gesture.dy / pitchDims.height) * 100));
            onMove(finalX, finalY);
          } else {
            onSelect();
          }
          setDragOffset({ x: 0, y: 0 });
        },
      }),
    [player.x, player.y, pitchDims.width, pitchDims.height, onMove, onSelect]
  );

  const currentX = Math.min(92, Math.max(8, player.x + dragOffset.x));
  const currentY = Math.min(94, Math.max(6, player.y + dragOffset.y));

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.playerPin,
        {
          left: `${currentX}%`,
          top: `${currentY}%`,
          transform: [{ translateX: -20 }, { translateY: -20 }],
        },
        isSelected && styles.playerPinSelected,
      ]}
    >
      <View
        style={[
          styles.playerBadge,
          isSelected && styles.playerBadgeSelected,
        ]}
      >
        <Text
          style={[
            styles.playerNumber,
            isSelected && styles.playerNumberSelected,
          ]}
        >
          {player.number}
        </Text>
        <View style={styles.playerRatingPill}>
          <Text style={styles.ratingText}>{player.rating}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.playerNameLabel,
          isSelected && styles.playerNameSelected,
        ]}
        numberOfLines={1}
      >
        {player.name}
      </Text>
      <Text style={styles.playerPositionLabel}>{player.position}</Text>
    </View>
  );
};

export const SoccerPitch: React.FC<SoccerPitchProps> = ({
  players,
  selectedPlayer,
  onSelectPlayer,
  onMovePlayer,
}) => {
  const [pitchDims, setPitchDims] = useState({ width: 0, height: 0 });

  return (
    <View style={styles.pitchContainer}>
      {/* Field Background Lines & Geometry */}
      <View
        style={styles.fieldOuter}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setPitchDims({ width, height });
        }}
      >
        {/* Halfway Line */}
        <View style={styles.halfwayLine} />

        {/* Center Circle */}
        <View style={styles.centerCircle}>
          <View style={styles.centerDot} />
        </View>

        {/* Penalty Area Top */}
        <View style={styles.penaltyAreaTop}>
          <View style={styles.goalAreaTop} />
          <View style={styles.penaltyArcTop} />
        </View>

        {/* Penalty Area Bottom */}
        <View style={styles.penaltyAreaBottom}>
          <View style={styles.goalAreaBottom} />
          <View style={styles.penaltyArcBottom} />
        </View>

        {/* Corner Arcs */}
        <View style={[styles.cornerArc, styles.cornerTL]} />
        <View style={[styles.cornerArc, styles.cornerTR]} />
        <View style={[styles.cornerArc, styles.cornerBL]} />
        <View style={[styles.cornerArc, styles.cornerBR]} />

        {/* Players Node Layer with PanResponder Drag & Drop */}
        {players.map((player) => (
          <DraggablePin
            key={player.id}
            player={player}
            isSelected={selectedPlayer?.id === player.id}
            onSelect={() => onSelectPlayer(player)}
            onMove={(newX, newY) => onMovePlayer?.(player.id, newX, newY)}
            pitchDims={pitchDims}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pitchContainer: {
    width: '100%',
    aspectRatio: 0.72,
    backgroundColor: '#0F1612', // Dark tactical stadium grass
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#243428',
    overflow: 'hidden',
    padding: 12,
  },
  fieldOuter: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 255, 44, 0.25)',
    borderRadius: 8,
    position: 'relative',
    backgroundColor: '#121A15',
  },
  halfwayLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(184, 255, 44, 0.25)',
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 255, 44, 0.25)',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(184, 255, 44, 0.4)',
  },
  penaltyAreaTop: {
    position: 'absolute',
    top: 0,
    left: '24%',
    right: '24%',
    height: 60,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(184, 255, 44, 0.2)',
    alignItems: 'center',
  },
  goalAreaTop: {
    position: 'absolute',
    top: 0,
    width: '50%',
    height: 25,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(184, 255, 44, 0.2)',
  },
  penaltyArcTop: {
    position: 'absolute',
    bottom: -16,
    width: 40,
    height: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: 'rgba(184, 255, 44, 0.2)',
  },
  penaltyAreaBottom: {
    position: 'absolute',
    bottom: 0,
    left: '24%',
    right: '24%',
    height: 60,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(184, 255, 44, 0.2)',
    alignItems: 'center',
  },
  goalAreaBottom: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 25,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(184, 255, 44, 0.2)',
  },
  penaltyArcBottom: {
    position: 'absolute',
    top: -16,
    width: 40,
    height: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(184, 255, 44, 0.2)',
  },
  cornerArc: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: 'rgba(184, 255, 44, 0.2)',
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderBottomRightRadius: 14 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderBottomLeftRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 1.5, borderTopWidth: 1.5, borderTopRightRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderTopLeftRadius: 14 },

  playerPin: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
    height: 48,
    zIndex: 10,
  },
  playerPinSelected: {
    zIndex: 20,
  },
  playerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E2822',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playerBadgeSelected: {
    backgroundColor: Colors.primary,
    borderColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.15 }],
  },
  playerNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  playerNumberSelected: {
    color: Colors.onPrimary,
  },
  playerRatingPill: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.secondary,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  ratingText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#002025',
  },
  playerNameLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
    textAlign: 'center',
    backgroundColor: 'rgba(8, 11, 16, 0.75)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  playerNameSelected: {
    color: Colors.primary,
    fontWeight: '900',
  },
  playerPositionLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.textMuted,
  },
});
