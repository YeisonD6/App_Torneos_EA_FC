import React, { createContext, useContext, useEffect, useState } from 'react';
import { ARSENAL_SQUAD, CLUBS, FORMATIONS_COORDS, INITIAL_DISPUTE, INITIAL_MATCHES, INITIAL_STANDINGS } from '../../data/mockTournamentData';
import { Club, DisputeCase, Formation, Match, MatchEvent, Player, StandingRow } from '../../types/tournament';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTournamentStore } from '../../stores/useTournamentStore';
import { standingsService } from '../../services/standings.service';
import { matchesService } from '../../services/matches.service';
import { matchEventsService } from '../../services/matchEvents.service';
import { playersService } from '../../services/players.service';

interface TournamentContextType {
  // Auth
  isLoggedIn: boolean;
  gamerTag: string;
  login: (tag?: string, pass?: string) => Promise<boolean>;
  logout: () => void;

  // Club & Squad
  assignedClub: Club;
  setAssignedClub: (club: Club) => void;
  squad: Player[];
  selectedFormation: Formation;
  setFormation: (formation: Formation) => void;
  pitchWidth: number;
  setPitchWidth: (val: number) => void;
  pitchDepth: number;
  setPitchDepth: (val: number) => void;
  selectedPlayer: Player | null;
  setSelectedPlayer: (p: Player | null) => void;
  updatePlayerPosition: (playerId: string, x: number, y: number) => void;

  // Matches
  matches: Match[];
  liveMatch: Match;
  addLiveEvent: (event: Omit<MatchEvent, 'id'>, playerId?: string, teamId?: string) => Promise<void>;
  finishMatch: () => void;
  submitResultProposal: (homeScore: number, awayScore: number, screenshotUrl?: string) => Promise<any>;
  respondToResultProposal: (proposalId: string, approved: boolean) => Promise<any>;

  // Standings
  standings: StandingRow[];
  refreshStandings: () => Promise<void>;

  // Dispute
  activeDispute: DisputeCase;
  resolveDispute: (verdict: string, homeScore: number, awayScore: number) => void;

  // Roulette
  spinAndAssignClub: () => Promise<Club | null>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loadSession, signIn, signOut } = useAuthStore();
  const { tournament, loadTournament, assignClub } = useTournamentStore();

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [customGamerTag, setCustomGamerTag] = useState('daniel.arteta@esports.fc');
  const gamerTag = profile?.gamer_tag || customGamerTag;

  const [assignedClub, setAssignedClubState] = useState<Club>(CLUBS[0]); // Arsenal FC por defecto
  const [selectedFormation, setSelectedFormation] = useState<Formation>('4-3-3 Ofensiva');
  const [pitchWidth, setPitchWidth] = useState(78);
  const [pitchDepth, setPitchDepth] = useState(85);
  const [squad, setSquad] = useState<Player[]>(ARSENAL_SQUAD);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(ARSENAL_SQUAD[8]);

  const updatePlayerPosition = (playerId: string, x: number, y: number) => {
    setSquad((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, x: Math.round(x), y: Math.round(y) } : p))
    );
  };

  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [liveMatch, setLiveMatch] = useState<Match>(INITIAL_MATCHES[0]);
  const [standings, setStandings] = useState<StandingRow[]>(INITIAL_STANDINGS);
  const [activeDispute, setActiveDispute] = useState<DisputeCase>(INITIAL_DISPUTE);

  // Inicializar sesión y torneo en segundo plano
  useEffect(() => {
    loadSession();
    loadTournament();
  }, [loadSession, loadTournament]);

  // Sincronizar tabla de posiciones desde Postgres
  const refreshStandings = async () => {
    try {
      const tourId = tournament?.id || '33333333-3333-3333-3333-333333333333';
      const rows = await standingsService.getStandings(tourId);
      if (rows && rows.length > 0) {
        const mapped: StandingRow[] = rows.map((r) => ({
          position: r.rank,
          clubName: r.club_name,
          shortName: r.club_short_name,
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          goalsFor: r.goals_for,
          goalsAgainst: r.goals_against,
          goalDiff: r.goal_difference,
          points: r.points,
          form: ['W', 'W', 'D', 'W', 'L'],
          isUserClub: r.club_id === assignedClub.id,
        }));
        setStandings(mapped);
      }
    } catch {
      // Usar tabla inicial si no hay red
    }
  };

  useEffect(() => {
    let isMounted = true;
    const tourId = tournament?.id || '33333333-3333-3333-3333-333333333333';
    standingsService.getStandings(tourId).then((rows) => {
      if (isMounted && rows && rows.length > 0) {
        const mapped: StandingRow[] = rows.map((r) => ({
          position: r.rank,
          clubName: r.club_name,
          shortName: r.club_short_name,
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          goalsFor: r.goals_for,
          goalsAgainst: r.goals_against,
          goalDiff: r.goal_difference,
          points: r.points,
          form: ['W', 'W', 'D', 'W', 'L'],
          isUserClub: r.club_id === assignedClub.id,
        }));
        setStandings(mapped);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [tournament?.id, assignedClub.id]);

  const login = async (tag?: string, pass?: string): Promise<boolean> => {
    if (tag) setCustomGamerTag(tag);
    if (pass && tag) {
      const res = await signIn(tag, pass);
      if (res.success) {
        setIsLoggedIn(true);
        return true;
      }
    }
    setIsLoggedIn(true);
    return true;
  };

  const logout = () => {
    signOut();
    setIsLoggedIn(false);
  };

  const setAssignedClub = (club: Club) => {
    setAssignedClubState(club);
    // Cargar jugadores del club seleccionado
    playersService.getSquadByClub(club.id).then((players) => {
      if (players && players.length > 0) {
        const coords = FORMATIONS_COORDS[selectedFormation] || FORMATIONS_COORDS['4-3-3 Ofensiva'];
        const mappedSquad: Player[] = players.map((p, idx) => ({
          id: p.id,
          name: p.name,
          number: p.shirt_number || 10,
          position: p.position as any,
          rating: p.rating,
          pace: p.rating,
          shooting: p.rating - 2,
          passing: p.rating,
          dribbling: p.rating + 1,
          defending: p.rating - 5,
          physical: p.rating - 2,
          photoUrl: p.photo_url || 'https://images.unsplash.com/photo-1570498839593-e565b3d7f672?w=150',
          x: coords[idx]?.x || 50,
          y: coords[idx]?.y || 50,
          isStarter: idx < 11,
        }));
        setSquad(mappedSquad);
        setSelectedPlayer(mappedSquad[0]);
      }
    });
  };

  const spinAndAssignClub = async (): Promise<Club | null> => {
    try {
      const assigned = await assignClub();
      if (assigned) {
        const mappedClub: Club = {
          id: assigned.id,
          name: assigned.name,
          shortName: assigned.short_name,
          color: assigned.color,
          accentColor: assigned.accent_color,
          logoUrl: assigned.logo_url || '',
          rating: assigned.rating,
          attack: assigned.attack,
          defense: assigned.defense,
          chemistry: assigned.chemistry,
          league: 'Premier League',
        };
        setAssignedClub(mappedClub);
        return mappedClub;
      }
    } catch (e) {
      console.warn('Error en asignación atómica de club:', e);
    }
    return null;
  };

  const setFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    const coords = FORMATIONS_COORDS[formation];
    if (coords) {
      setSquad((prev) =>
        prev.map((player, idx) => {
          const c = coords[idx];
          return c ? { ...player, x: c.x, y: c.y } : player;
        })
      );
    }
  };

  const addLiveEvent = async (
    eventData: Omit<MatchEvent, 'id'>,
    playerId?: string,
    teamId?: string
  ) => {
    const newEvent: MatchEvent = {
      ...eventData,
      id: `evt_${Date.now()}`,
    };

    // 1. DB FIRST: Intentar guardar en Supabase si matchId existe
    if (liveMatch.id && !liveMatch.id.startsWith('mock')) {
      const rawType = eventData.type === 'goal' ? 'goal' : eventData.type === 'yellow_card' ? 'yellow_card' : 'red_card';
      const minuteNum = parseInt(eventData.minute.replace("'", ''), 10) || 70;
      await matchEventsService.addMatchEvent({
        matchId: liveMatch.id,
        teamId: teamId || (eventData.team === 'home' ? liveMatch.homeTeam.id : liveMatch.awayTeam.id),
        playerId: playerId || '00000000-0000-0000-0000-000000000001',
        eventType: rawType,
        minute: minuteNum,
        clientEventId: newEvent.id,
      });
    }

    // 2. Actualizar estado local reactivo
    setLiveMatch((prev) => {
      let newHomeScore = prev.homeScore;
      let newAwayScore = prev.awayScore;
      if (newEvent.type === 'goal') {
        if (newEvent.team === 'home') newHomeScore += 1;
        else newAwayScore += 1;
      }
      const updated = {
        ...prev,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        events: [newEvent, ...prev.events],
      };

      setMatches((all) => all.map((m) => (m.id === prev.id ? updated : m)));
      return updated;
    });
  };

  const finishMatch = () => {
    setLiveMatch((prev) => ({
      ...prev,
      status: 'finished',
      minute: 'FINAL',
      timeUTC: 'FINALIZADO',
    }));

    setMatches((all) =>
      all.map((m) =>
        m.id === liveMatch.id
          ? { ...m, status: 'finished', minute: 'FINAL', timeUTC: 'FINALIZADO' }
          : m
      )
    );

    // Actualizar tabla local
    setStandings((prev) =>
      prev.map((row) => {
        if (row.isUserClub) {
          return {
            ...row,
            won: row.won + 1,
            points: row.points + 3,
            played: row.played + 1,
            goalsFor: row.goalsFor + liveMatch.homeScore,
            goalsAgainst: row.goalsAgainst + liveMatch.awayScore,
            goalDiff: row.goalDiff + (liveMatch.homeScore - liveMatch.awayScore),
            form: ['W', ...row.form.slice(0, 4)],
          };
        }
        return row;
      })
    );
  };

  const submitResultProposal = async (homeScore: number, awayScore: number, screenshotUrl?: string) => {
    return matchesService.submitMatchResult(liveMatch.id, homeScore, awayScore, screenshotUrl);
  };

  const respondToResultProposal = async (proposalId: string, approved: boolean) => {
    return matchesService.respondToMatchResult(proposalId, approved);
  };

  const resolveDispute = (verdict: string, hScore: number, aScore: number) => {
    setActiveDispute((prev) => ({
      ...prev,
      status: 'resolved',
      reportedHomeScore: hScore,
      reportedAwayScore: aScore,
      resolutionVerdict: verdict,
    }));
  };

  return (
    <TournamentContext.Provider
      value={{
        isLoggedIn,
        gamerTag,
        login,
        logout,
        assignedClub,
        setAssignedClub,
        squad,
        selectedFormation,
        setFormation,
        pitchWidth,
        setPitchWidth,
        pitchDepth,
        setPitchDepth,
        selectedPlayer,
        setSelectedPlayer,
        updatePlayerPosition,
        matches,
        liveMatch,
        addLiveEvent,
        finishMatch,
        submitResultProposal,
        respondToResultProposal,
        standings,
        refreshStandings,
        activeDispute,
        resolveDispute,
        spinAndAssignClub,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
