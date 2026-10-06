import { useCallback, useEffect, useState } from 'react';
import { EventType, MatchEvent } from '../types/database.types';
import { matchEventsService } from '../services/matchEvents.service';

export function useLiveMatchEvents(matchId: string) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loadedMatchId, setLoadedMatchId] = useState<string | null>(null);

  const isLoading = !matchId || loadedMatchId !== matchId;

  // Carga inicial asíncrona
  useEffect(() => {
    let active = true;
    if (!matchId) return;

    matchEventsService.getMatchEvents(matchId).then((data) => {
      if (active) {
        setEvents(data);
        setLoadedMatchId(matchId);
      }
    });

    return () => {
      active = false;
    };
  }, [matchId]);

  // Suscripción Realtime por canal WebSocket
  useEffect(() => {
    if (!matchId) return;

    const sub = matchEventsService.subscribeToMatch(matchId, (newEvent) => {
      setEvents((prev) => {
        // Evitar duplicados por client_event_id o id
        if (
          prev.some(
            (e) =>
              e.id === newEvent.id ||
              (e.client_event_id && e.client_event_id === newEvent.client_event_id)
          )
        ) {
          return prev;
        }
        return [...prev, newEvent];
      });
    });

    return () => {
      sub?.unsubscribe();
    };
  }, [matchId]);

  // Registrar evento DB-first
  const recordEvent = useCallback(
    async (
      teamId: string,
      playerId: string,
      eventType: EventType,
      minute: number,
      clientEventId?: string
    ) => {
      const { data, error } = await matchEventsService.addMatchEvent({
        matchId,
        teamId,
        playerId,
        eventType,
        minute,
        clientEventId,
      });

      if (!error && data) {
        setEvents((prev) => {
          if (
            prev.some(
              (e) =>
                e.id === data.id ||
                (data.client_event_id && e.client_event_id === data.client_event_id)
            )
          ) {
            return prev;
          }
          return [...prev, data];
        });
      }

      return { data, error };
    },
    [matchId]
  );

  return {
    events,
    isLoading,
    recordEvent,
  };
}
