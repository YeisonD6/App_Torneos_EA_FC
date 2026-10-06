import { useEffect, useState } from 'react';
import { Player } from '../types/database.types';
import { playersService } from '../services/players.service';

export function usePlayerSearch(clubId: string, debounceMs = 350) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rawPlayers, setRawPlayers] = useState<Player[]>([]);
  const isDebouncing = query !== debouncedQuery;
  const [isFetching, setIsFetching] = useState(false);

  // Derived: if no clubId, players is always empty
  const players = clubId ? rawPlayers : [];

  // Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [query, debounceMs]);

  // Consulta en PostgreSQL acotada estrictamente a clubId
  useEffect(() => {
    if (!clubId) return;

    let active = true;
    playersService
      .searchPlayersByClub(clubId, debouncedQuery)
      .then((res) => {
        if (active) {
          setRawPlayers(res);
          setIsFetching(false);
        }
      })
      .catch(() => {
        if (active) setIsFetching(false);
      });

    return () => {
      active = false;
    };
  }, [clubId, debouncedQuery]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text !== debouncedQuery) {
      setIsFetching(true);
    }
  };

  return {
    query,
    setQuery: handleQueryChange,
    players,
    isSearching: isDebouncing || isFetching,
  };
}
