import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { TacticalBoard } from '../types/database.types';

export const tacticsService = {
  async getTacticalBoard(participantId: string): Promise<TacticalBoard | null> {
    if (!isSupabaseConfigured()) {
      return {
        id: 'board-demo',
        participant_id: participantId,
        formation: '4-3-3 Ofensiva',
        pitch_width: 75,
        pitch_depth: 80,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        positions: [],
      };
    }

    const { data, error } = await supabase
      .from('tactical_boards')
      .select('*, positions:tactical_positions(*, player:players(*))')
      .eq('participant_id', participantId)
      .maybeSingle();

    if (error || !data) return null;
    return data as TacticalBoard;
  },

  async updateFormation(boardId: string, formation: string, width = 75, depth = 80) {
    if (!isSupabaseConfigured()) return;

    await supabase
      .from('tactical_boards')
      .update({
        formation,
        pitch_width: width,
        pitch_depth: depth,
        updated_at: new Date().toISOString(),
      })
      .eq('id', boardId);
  },

  async savePositions(
    boardId: string,
    positions: { playerId: string; x: number; y: number; isStarter: boolean }[]
  ) {
    if (!isSupabaseConfigured()) return;

    // Delete existing positions for board
    await supabase.from('tactical_positions').delete().eq('board_id', boardId);

    // Normalize coordinates strictly to [0.000, 1.000]
    const clamped = positions.map((p) => ({
      board_id: boardId,
      player_id: p.playerId,
      x: Math.min(Math.max(Number(p.x.toFixed(3)), 0), 1),
      y: Math.min(Math.max(Number(p.y.toFixed(3)), 0), 1),
      is_starter: p.isStarter,
    }));

    await supabase.from('tactical_positions').insert(clamped);
  },
};
