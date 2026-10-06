import { useCallback, useEffect, useState } from 'react';
import { Club } from '../types/database.types';
import { clubsService } from '../services/clubs.service';

export function useClubsData(leagueId?: string) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = leagueId
        ? await clubsService.getClubsByLeague(leagueId)
        : await clubsService.getClubs();
      setClubs(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener clubes');
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    let active = true;
    const fetcher = leagueId
      ? clubsService.getClubsByLeague(leagueId)
      : clubsService.getClubs();

    fetcher
      .then((data) => {
        if (active) {
          setClubs(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Error al obtener clubes');
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [leagueId]);

  return {
    clubs,
    isLoading,
    error,
    refetch: fetchClubs,
  };
}
