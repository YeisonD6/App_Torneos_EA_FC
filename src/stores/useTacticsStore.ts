import { create } from 'zustand';
import { Player } from '../types/database.types';
import { tacticsService } from '../services/tactics.service';

export interface FormationPreset {
  name: string;
  positions: { role: string; x: number; y: number }[];
}

export const FORMATIONS: Record<string, FormationPreset> = {
  '4-3-3 Ofensiva': {
    name: '4-3-3 Ofensiva',
    positions: [
      { role: 'POR', x: 0.50, y: 0.90 },
      { role: 'LD',  x: 0.85, y: 0.72 },
      { role: 'DFC', x: 0.62, y: 0.76 },
      { role: 'DFC', x: 0.38, y: 0.76 },
      { role: 'LI',  x: 0.15, y: 0.72 },
      { role: 'MCD', x: 0.50, y: 0.55 },
      { role: 'MC',  x: 0.68, y: 0.44 },
      { role: 'MC',  x: 0.32, y: 0.44 },
      { role: 'ED',  x: 0.82, y: 0.22 },
      { role: 'DC',  x: 0.50, y: 0.16 },
      { role: 'EI',  x: 0.18, y: 0.22 },
    ],
  },
  '4-4-2 Clásica': {
    name: '4-4-2 Clásica',
    positions: [
      { role: 'POR', x: 0.50, y: 0.90 },
      { role: 'LD',  x: 0.85, y: 0.72 },
      { role: 'DFC', x: 0.62, y: 0.76 },
      { role: 'DFC', x: 0.38, y: 0.76 },
      { role: 'LI',  x: 0.15, y: 0.72 },
      { role: 'MD',  x: 0.84, y: 0.45 },
      { role: 'MC',  x: 0.60, y: 0.48 },
      { role: 'MC',  x: 0.40, y: 0.48 },
      { role: 'MI',  x: 0.16, y: 0.45 },
      { role: 'DC',  x: 0.60, y: 0.20 },
      { role: 'DC',  x: 0.40, y: 0.20 },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { role: 'POR', x: 0.50, y: 0.90 },
      { role: 'DFC', x: 0.75, y: 0.76 },
      { role: 'DFC', x: 0.50, y: 0.78 },
      { role: 'DFC', x: 0.25, y: 0.76 },
      { role: 'CAD', x: 0.88, y: 0.52 },
      { role: 'MCD', x: 0.60, y: 0.58 },
      { role: 'MCD', x: 0.40, y: 0.58 },
      { role: 'CAI', x: 0.12, y: 0.52 },
      { role: 'MCO', x: 0.50, y: 0.36 },
      { role: 'DC',  x: 0.62, y: 0.18 },
      { role: 'DC',  x: 0.38, y: 0.18 },
    ],
  },
};

interface TacticsState {
  formation: string;
  pitchWidth: number;
  pitchDepth: number;
  starters: Player[];
  bench: Player[];
  positions: { playerId: string; role: string; x: number; y: number }[];

  setFormation: (formation: string) => void;
  setPitchWidth: (val: number) => void;
  setPitchDepth: (val: number) => void;
  setSquad: (players: Player[]) => void;
  updatePlayerCoords: (playerId: string, x: number, y: number) => void;
  saveTactics: (participantId: string) => Promise<void>;
}

export const useTacticsStore = create<TacticsState>((set, get) => ({
  formation: '4-3-3 Ofensiva',
  pitchWidth: 75,
  pitchDepth: 80,
  starters: [],
  bench: [],
  positions: [],

  setFormation: (formName: string) => {
    const preset = FORMATIONS[formName] || FORMATIONS['4-3-3 Ofensiva'];
    const currentStarters = get().starters;

    const newPositions = preset.positions.map((p, idx) => ({
      playerId: currentStarters[idx]?.id || `starter-${idx}`,
      role: p.role,
      x: p.x,
      y: p.y,
    }));

    set({ formation: formName, positions: newPositions });
  },

  setPitchWidth: (pitchWidth: number) => set({ pitchWidth }),
  setPitchDepth: (pitchDepth: number) => set({ pitchDepth }),

  setSquad: (players: Player[]) => {
    const starters = players.slice(0, 11);
    const bench = players.slice(11);
    const preset = FORMATIONS[get().formation] || FORMATIONS['4-3-3 Ofensiva'];

    const positions = preset.positions.map((p, idx) => ({
      playerId: starters[idx]?.id || `starter-${idx}`,
      role: p.role,
      x: p.x,
      y: p.y,
    }));

    set({ starters, bench, positions });
  },

  updatePlayerCoords: (playerId: string, rawX: number, rawY: number) => {
    // Clamp to 0.000 .. 1.000
    const x = Math.min(Math.max(Number(rawX.toFixed(3)), 0.05), 0.95);
    const y = Math.min(Math.max(Number(rawY.toFixed(3)), 0.05), 0.95);

    const positions = get().positions.map((pos) =>
      pos.playerId === playerId ? { ...pos, x, y } : pos
    );
    set({ positions });
  },

  saveTactics: async (participantId: string) => {
    const { positions } = get();
    await tacticsService.savePositions(
      participantId,
      positions.map((p) => ({
        playerId: p.playerId,
        x: p.x,
        y: p.y,
        isStarter: true,
      }))
    );
  },
}));
