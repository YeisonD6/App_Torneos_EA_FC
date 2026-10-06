import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { EventType, MatchEvent } from '../types/database.types';

export const matchEventsService = {
  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('match_events')
      .select('*, player:players(*), team:clubs(*)')
      .eq('match_id', matchId)
      .order('minute', { ascending: true });

    if (error || !data) return [];
    return data as MatchEvent[];
  },

  async addMatchEvent(params: {
    matchId: string;
    teamId: string;
    playerId: string;
    eventType: EventType;
    minute: number;
    clientEventId?: string;
  }): Promise<{ data: MatchEvent | null; error: any }> {
    const { matchId, teamId, playerId, eventType, minute, clientEventId } = params;

    if (!isSupabaseConfigured()) {
      const mockEvent: MatchEvent = {
        id: clientEventId || `event-${Date.now()}`,
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        event_type: eventType,
        minute,
        client_event_id: clientEventId || null,
        created_by: 'mock-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: mockEvent, error: null };
    }

    // DB FIRST: Insert event into PostgreSQL
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('match_events')
      .insert({
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        event_type: eventType,
        minute,
        client_event_id: clientEventId || null,
        created_by: user?.id || 'anonymous',
      })
      .select('*, player:players(*), team:clubs(*)')
      .single();

    return { data: (data as unknown) as MatchEvent, error };
  },

  subscribeToMatch(matchId: string, onEvent: (event: MatchEvent) => void) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_events',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          // Fetch full event with relations
          const { data } = await supabase
            .from('match_events')
            .select('*, player:players(*), team:clubs(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onEvent(data as MatchEvent);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
