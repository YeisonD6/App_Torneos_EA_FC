import { useCallback, useEffect, useState } from 'react';
import { StandingsRow } from '../types/database.types';
import { standingsService } from '../services/standings.service';

export function useStandingsData(tournamentId: string) {
  const [standings, setStandings] = useState<StandingsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await standingsService.getStandings(tournamentId);
      setStandings(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener la tabla de posiciones');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) return;
    let active = true;

    standingsService
      .getStandings(tournamentId)
      .then((data) => {
        if (active) {
          setStandings(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Error al obtener la tabla de posiciones');
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [tournamentId]);

  return {
    standings,
    isLoading,
    error,
    refetch: fetchStandings,
  };
}
