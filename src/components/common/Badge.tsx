import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'lime' | 'cyan' | 'danger' | 'muted' | 'warning' | 'live';
  size?: 'sm' | 'md';
  pulse?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'lime',
  size = 'md',
  pulse = false,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        size === 'sm' && styles.containerSm,
        variant === 'lime' && styles.limeBg,
        variant === 'cyan' && styles.cyanBg,
        variant === 'danger' && styles.dangerBg,
        variant === 'warning' && styles.warningBg,
        variant === 'muted' && styles.mutedBg,
        variant === 'live' && styles.liveBg,
        style,
      ]}
    >
      {(pulse || variant === 'live') && (
        <View
          style={[
            styles.dot,
            variant === 'live' && styles.liveDot,
            variant === 'cyan' && styles.cyanDot,
            variant === 'lime' && styles.limeDot,
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          variant === 'lime' && styles.limeText,
          variant === 'cyan' && styles.cyanText,
          variant === 'danger' && styles.dangerText,
          variant === 'warning' && styles.warningText,
          variant === 'muted' && styles.mutedText,
          variant === 'live' && styles.liveText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  limeBg: {
    backgroundColor: 'rgba(184, 255, 44, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(184, 255, 44, 0.3)',
  },
  limeDot: {
    backgroundColor: Colors.primary,
  },
  limeText: {
    color: Colors.primary,
  },
  cyanBg: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  cyanDot: {
    backgroundColor: Colors.secondary,
  },
  cyanText: {
    color: Colors.secondary,
  },
  liveBg: {
    backgroundColor: 'rgba(34, 211, 238, 0.18)',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  liveDot: {
    backgroundColor: Colors.secondary,
  },
  liveText: {
    color: Colors.secondaryBright,
    fontWeight: '800',
  },
  dangerBg: {
    backgroundColor: 'rgba(255, 70, 85, 0.15)',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  dangerText: {
    color: Colors.danger,
  },
  warningBg: {
    backgroundColor: 'rgba(255, 201, 40, 0.15)',
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  warningText: {
    color: Colors.warning,
  },
  mutedBg: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mutedText: {
    color: Colors.textSecondary,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textSm: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
