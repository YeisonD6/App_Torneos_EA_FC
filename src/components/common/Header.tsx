import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useTournament } from '../../features/tournament/TournamentContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'FC COMPANION',
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const { assignedClub } = useTournament();

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 14) + 6,
          paddingBottom: 14,
        },
      ]}
    >
      <View style={styles.leftCol}>
        {showBack ? (
          <Pressable onPress={handleBack} style={styles.iconBtn} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
            <View style={styles.avatarBorder}>
              <MaterialCommunityIcons name="shield-account" size={22} color={Colors.primary} />
            </View>
            <View style={styles.onlineDot} />
          </Pressable>
        )}

        <View style={styles.titleCol}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitleText}>{subtitle}</Text>
          ) : (
            <View style={styles.metaRow}>
              <Text style={styles.divisionText}>DIVISIÓN ÉLITE</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.clubText}>{assignedClub.shortName}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightCol}>
        {rightAction ? (
          rightAction
        ) : (
          <Pressable
            onPress={() => router.push('/dispute')}
            style={styles.varBadgeBtn}
            hitSlop={8}
          >
            <MaterialIcons name="gavel" size={18} color={Colors.warning} />
            <Text style={styles.varText}>VAR</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    position: 'relative',
  },
  avatarBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  titleCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  divisionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  clubText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  varBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 201, 40, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 40, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  varText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
});
