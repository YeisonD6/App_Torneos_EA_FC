import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Colors } from '../constants/theme';
import { useTournament } from '../features/tournament/TournamentContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useTournament();
  const [gamerTag, setGamerTag] = useState('daniel.arteta@esports.fc');
  const [password, setPassword] = useState('TacticalStriker2024');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await login(gamerTag, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRoulette = () => {
    router.push('/roulette');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Official Emblem */}
        <View style={styles.headerSection}>
          <View style={styles.emblemWrapper}>
            <Image
              source={require('../../assets/images/fc-emblem.png')}
              style={styles.emblemImage}
              resizeMode="contain"
            />
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDotInner} />
            </View>
          </View>

          <Text style={styles.tournamentTitle}>FC TOURNAMENT</Text>
          <Text style={styles.companionSubtitle}>COMPANION</Text>

          <Badge
            label="TEMPORADA 24/25 • DIVISIÓN ÉLITE"
            variant="cyan"
            size="md"
            pulse
            style={styles.divisionBadge}
          />
        </View>

        {/* Welcome Greeting Card */}
        <Card variant="low" style={styles.greetingCard}>
          <View style={styles.greetingHeader}>
            <MaterialIcons name="shield" size={20} color={Colors.primary} />
            <Text style={styles.greetingTitle}>Bienvenido de vuelta, Capitán</Text>
          </View>
          <Text style={styles.greetingBody}>
            Ingresa tus credenciales federadas para acceder a tu escuadra y partidos oficiales.
          </Text>
        </Card>

        {/* Credentials Form */}
        <View style={styles.formContainer}>
          {/* Gamer Tag Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Gamer Tag o Email Federado</Text>
              <Text style={styles.verifiedTag}>ID VERIFICADO</Text>
            </View>
            <View style={styles.inputBox}>
              <MaterialIcons
                name="alternate-email"
                size={20}
                color={Colors.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={gamerTag}
                onChangeText={setGamerTag}
                placeholder="tag@esports.fc"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Contraseña Táctica</Text>
              <Text style={styles.cryptoTag}>CIFRADO SHA-256</Text>
            </View>
            <View style={styles.inputBox}>
              <MaterialIcons
                name="lock"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { paddingRight: 40 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={10}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Remember me & Forgot Password */}
          <View style={styles.utilityRow}>
            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && (
                  <MaterialIcons name="check" size={14} color={Colors.onPrimary} />
                )}
              </View>
              <Text style={styles.rememberText}>Recordar consola / app</Text>
            </Pressable>

            <Pressable>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>

          {/* Error Message */}
          {authError && (
            <Text style={{ color: Colors.danger, fontSize: 12, textAlign: 'center' }}>
              {authError}
            </Text>
          )}

          {/* Primary Action CTA */}
          <Button
            title={isLoading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
            onPress={handleLogin}
            variant="primary"
            disabled={isLoading}
            icon={<MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />}
            style={styles.loginBtn}
          />

          {/* Switch to Register */}
          <View style={styles.registerLinkRow}>
            <Text style={styles.registerLinkMuted}>¿Nuevo capitán en la liga?</Text>
            <Pressable onPress={() => router.push('/register')} hitSlop={10}>
              <Text style={styles.registerLinkText}>Regístrate Aquí</Text>
            </Pressable>
          </View>
        </View>

        {/* Platform Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>O INGRESA CON CUENTA DE PLATAFORMA</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Platform SSO Quick Connect */}
        <View style={styles.ssoRow}>
          <Pressable onPress={handleLogin} style={styles.ssoBtn}>
            <View style={styles.ssoIconCircle}>
              <MaterialCommunityIcons name="sony-playstation" size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.ssoLabel}>PSN</Text>
          </Pressable>

          <Pressable onPress={handleLogin} style={styles.ssoBtn}>
            <View style={styles.ssoIconCircle}>
              <MaterialCommunityIcons name="microsoft-xbox" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.ssoLabel}>XBOX</Text>
          </Pressable>

          <Pressable onPress={handleLogin} style={styles.ssoBtn}>
            <View style={styles.ssoIconCircle}>
              <MaterialIcons name="sports-soccer" size={22} color={Colors.danger} />
            </View>
            <Text style={styles.ssoLabel}>EA SPORTS</Text>
          </Pressable>
        </View>

        {/* Roulette Sorteo Callout Card */}
        <Card variant="high" style={styles.rouletteCard}>
          <MaterialCommunityIcons name="slot-machine-outline" size={28} color={Colors.primary} />
          <Text style={styles.rouletteCardText}>
            ¿Aún no tienes club asignado? Participa en el sorteo oficial con la Ruleta Táctica.
          </Text>
          <Pressable onPress={handleGoToRoulette} style={styles.rouletteActionBtn}>
            <Text style={styles.rouletteActionText}>GIRAR RULETA DE CLUBES</Text>
            <MaterialIcons name="arrow-forward" size={16} color={Colors.primary} />
          </Pressable>
        </Card>

        {/* Latency Server Bar */}
        <View style={styles.latencyBar}>
          <View style={styles.latencyDot} />
          <Text style={styles.latencyText}>
            Servidores de Competición Online (Latencia 18ms)
          </Text>
        </View>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emblemWrapper: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
    position: 'relative',
  },
  emblemImage: {
    width: 72,
    height: 72,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  onlineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface,
  },
  tournamentTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  companionSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 10,
  },
  divisionBadge: {
    marginTop: 4,
  },
  greetingCard: {
    marginBottom: 20,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  greetingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  greetingBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  verifiedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  cryptoTag: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLow,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  ssoRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  ssoBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  ssoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rouletteCard: {
    marginTop: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    borderColor: 'rgba(184, 255, 44, 0.3)',
    backgroundColor: 'rgba(18, 24, 33, 0.85)',
  },
  rouletteCardText: {
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  rouletteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  rouletteActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  latencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 24,
  },
  latencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  latencyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  registerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  registerLinkMuted: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  registerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
