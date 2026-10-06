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
import { authService } from '../services/auth.service';

type Platform = 'PS5' | 'XBOX' | 'PC';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  const [gamerTag, setGamerTag] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [platform, setPlatform] = useState<Platform>('PS5');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!gamerTag.trim()) {
      setErrorMessage('El Gamer Tag federado es obligatorio.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await authService.signUp(
        email.trim(),
        password,
        displayName.trim() || gamerTag.trim(),
        gamerTag.trim()
      );

      if (error) {
        setErrorMessage(error.message || 'Error al crear la cuenta federada.');
        return;
      }

      if (user) {
        // Registro exitoso -> Dirigirse a la ruleta para el sorteo del club
        router.replace('/roulette');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado durante el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/login');
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
        {/* Header Section */}
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

          <Text style={styles.tournamentTitle}>REGISTRO DE CAPITÁN</Text>
          <Text style={styles.companionSubtitle}>LICENCIA OFICIAL EA FC 25</Text>

          <Badge
            label="TEMPORADA REGULAR • INSCRIPCIÓN ABIERTA"
            variant="lime"
            size="md"
            pulse
            style={styles.divisionBadge}
          />
        </View>

        {/* Info Card */}
        <Card variant="low" style={styles.greetingCard}>
          <View style={styles.greetingHeader}>
            <MaterialIcons name="person-add" size={20} color={Colors.primary} />
            <Text style={styles.greetingTitle}>Crea tu Perfil Federado</Text>
          </View>
          <Text style={styles.greetingBody}>
            Registra tu GamerTag único para participar en el sorteo de franquicias y competir en la liga.
          </Text>
        </Card>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          {/* Gamer Tag */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Gamer Tag Oficial EA Sports</Text>
              <Text style={styles.requiredTag}>OBLIGATORIO</Text>
            </View>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons
                name="controller-classic"
                size={20}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={gamerTag}
                onChangeText={setGamerTag}
                placeholder="Ej. Striker_Arteta"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Nombre Completo / Apodo</Text>
            </View>
            <View style={styles.inputBox}>
              <MaterialIcons
                name="badge"
                size={20}
                color={Colors.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ej. Daniel Arteta"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          {/* Platform Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Plataforma Competitiva</Text>
            <View style={styles.platformRow}>
              {(['PS5', 'XBOX', 'PC'] as Platform[]).map((p) => {
                const isSelected = platform === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPlatform(p)}
                    style={[
                      styles.platformBtn,
                      isSelected && styles.platformBtnActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        p === 'PS5'
                          ? 'sony-playstation'
                          : p === 'XBOX'
                          ? 'microsoft-xbox'
                          : 'laptop'
                      }
                      size={18}
                      color={isSelected ? Colors.background : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.platformLabel,
                        isSelected && styles.platformLabelActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Correo Electrónico</Text>
            </View>
            <View style={styles.inputBox}>
              <MaterialIcons
                name="email"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="capitan@torneo.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <Text style={styles.cryptoTag}>MÍN. 6 CARACTERES</Text>
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

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
            <View style={styles.inputBox}>
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Submit CTA */}
          <Button
            title={isLoading ? 'REGISTRANDO...' : 'REGISTRARME & IR AL SORTEO'}
            onPress={handleRegister}
            variant="primary"
            disabled={isLoading}
            icon={<MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />}
            style={styles.submitBtn}
          />

          {/* Switch to Login */}
          <View style={styles.loginLinkRow}>
            <Text style={styles.loginLinkMuted}>¿Ya tienes cuenta federada?</Text>
            <Pressable onPress={handleGoToLogin} hitSlop={10}>
              <Text style={styles.loginLinkText}>Inicia Sesión</Text>
            </Pressable>
          </View>
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
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emblemImage: {
    width: 80,
    height: 80,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  onlineDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  tournamentTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  companionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 3,
    marginTop: 2,
    textAlign: 'center',
  },
  divisionBadge: {
    marginTop: 10,
  },
  greetingCard: {
    marginBottom: 20,
    padding: 14,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  greetingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  greetingBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  formContainer: {
    gap: 14,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  cryptoTag: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  platformRow: {
    flexDirection: 'row',
    gap: 10,
  },
  platformBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  platformBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  platformLabelActive: {
    color: Colors.onPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
  },
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  loginLinkMuted: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
