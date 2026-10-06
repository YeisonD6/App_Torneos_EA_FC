import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Header } from '../../components/common/Header';
import { MatchCard } from '../../components/match/MatchCard';
import { Colors } from '../../constants/theme';
import { useTournament } from '../../features/tournament/TournamentContext';

export default function CalendarScreen() {
  const { matches, liveMatch } = useTournament();
  const [selectedMatchday, setSelectedMatchday] = useState(6);
  const [filterState, setFilterState] = useState<'all' | 'live' | 'finished' | 'scheduled'>('all');

  const matchdays = [
    { day: 1, status: 'completed' },
    { day: 2, status: 'completed' },
    { day: 3, status: 'completed' },
    { day: 4, status: 'completed' },
    { day: 5, status: 'completed' },
    { day: 6, status: 'active' },
    { day: 7, status: 'locked' },
    { day: 8, status: 'locked' },
  ];

  // Partidos de la jornada seleccionada
  const dayMatches = matches.filter((m) => m.matchday === selectedMatchday);

  // Filtro por estado
  const filteredMatches = dayMatches.filter((m) => {
    if (filterState === 'all') return true;
    return m.status === filterState;
  });

  // Partido de usuario para la jornada seleccionada
  const userMatchOfDay = dayMatches.find((m) => m.isUserMatch) || (selectedMatchday === 6 ? liveMatch : null);

  // Contadores dinámicos
  const liveCount = dayMatches.filter((m) => m.status === 'live').length;
  const finishedCount = dayMatches.filter((m) => m.status === 'finished').length;
  const scheduledCount = dayMatches.filter((m) => m.status === 'scheduled').length;

  return (
    <View style={styles.container}>
      <Header
        title="Calendario"
        subtitle={`Jornada ${selectedMatchday} ${
          selectedMatchday === 6 ? 'en curso' : selectedMatchday < 6 ? 'completada' : 'programada'
        } • Fase Regular`}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Horizontal Matchday Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matchdaysScroll}
        >
          {matchdays.map((item) => {
            const isSelected = selectedMatchday === item.day;
            const isActive = item.status === 'active';
            const isCompleted = item.status === 'completed';
            const isLocked = item.status === 'locked';

            return (
              <Pressable
                key={item.day}
                onPress={() => setSelectedMatchday(item.day)}
                style={[
                  styles.matchdayChip,
                  isSelected && styles.matchdayChipSelected,
                  isLocked && styles.matchdayChipLocked,
                ]}
              >
                <Text
                  style={[
                    styles.matchdayChipText,
                    isSelected && styles.matchdayChipTextSelected,
                    isLocked && styles.matchdayChipTextLocked,
                  ]}
                >
                  J{item.day}
                </Text>
                {isCompleted && (
                  <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                )}
                {isActive && (
                  <View style={styles.activeDot} />
                )}
                {isLocked && (
                  <MaterialIcons name="schedule" size={12} color={Colors.textMuted} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Featured Official Match Box if present */}
        {userMatchOfDay && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionHeaderTitle}>TU PARTIDO OFICIAL</Text>
            <MatchCard
              match={userMatchOfDay}
              featured
              onPress={() => {
                if (userMatchOfDay.status === 'live') {
                  router.push('/live-match');
                }
              }}
            />
          </View>
        )}

        {/* Filter Pills with Dynamic Counts */}
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setFilterState('all')}
            style={[styles.filterChip, filterState === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterState === 'all' && styles.filterChipTextActive]}>
              Todos ({dayMatches.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterState('live')}
            style={[styles.filterChip, filterState === 'live' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterState === 'live' && styles.filterChipTextActive]}>
              En Directo ({liveCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterState('finished')}
            style={[styles.filterChip, filterState === 'finished' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterState === 'finished' && styles.filterChipTextActive]}>
              Finalizados ({finishedCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterState('scheduled')}
            style={[styles.filterChip, filterState === 'scheduled' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterState === 'scheduled' && styles.filterChipTextActive]}>
              Pendientes ({scheduledCount})
            </Text>
          </Pressable>
        </View>

        {/* Matches List for Selected Matchday */}
        <View style={styles.matchesList}>
          <Text style={styles.sectionHeaderTitle}>
            FIXTURE JORNADA {selectedMatchday} ({filteredMatches.length} PARTIDOS)
          </Text>

          {filteredMatches.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="event-busy" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No hay partidos con el filtro seleccionado</Text>
            </View>
          ) : (
            filteredMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                onPress={() => {
                  if (m.isUserMatch && m.status === 'live') {
                    router.push('/live-match');
                  }
                }}
              />
            ))
          )}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  matchdaysScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  matchdayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchdayChipSelected: {
    backgroundColor: Colors.surfaceHigh,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  matchdayChipLocked: {
    opacity: 0.45,
  },
  matchdayChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  matchdayChipTextSelected: {
    color: Colors.primary,
  },
  matchdayChipTextLocked: {
    color: Colors.textMuted,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  featuredSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(184, 255, 44, 0.1)',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  matchesList: {
    gap: 4,
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
