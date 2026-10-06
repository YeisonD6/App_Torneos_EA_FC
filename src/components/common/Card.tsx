import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'surface' | 'container' | 'low' | 'high' | 'active';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'surface',
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'surface' && styles.surface,
        variant === 'container' && styles.container,
        variant === 'low' && styles.low,
        variant === 'high' && styles.high,
        variant === 'active' && styles.active,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  surface: {
    backgroundColor: Colors.surface,
  },
  container: {
    backgroundColor: Colors.surfaceContainer,
  },
  low: {
    backgroundColor: Colors.surfaceLow,
  },
  high: {
    backgroundColor: Colors.surfaceHigh,
  },
  active: {
    backgroundColor: Colors.surfaceHigh,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});
