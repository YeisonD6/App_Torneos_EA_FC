import { create } from 'zustand';
import { Profile } from '../types/database.types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  loadSession: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string, gamerTag: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,

  loadSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const { user, profile } = await authService.getCurrentSession();
      set({ user, profile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  signIn: async (email: string, pass: string) => {
    try {
      set({ isLoading: true, error: null });
      const { user, profile, error } = await authService.signIn(email, pass);
      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }
      set({ user, profile, isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  signUp: async (email: string, pass: string, name: string, gamerTag: string) => {
    try {
      set({ isLoading: true, error: null });
      const { user, profile, error } = await authService.signUp(email, pass, name, gamerTag);
      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }
      set({ user, profile, isLoading: false });
      return { success: true };
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, profile: null });
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) return;
    const updated = await authService.updateProfile(user.id, updates);
    if (updated) {
      set({ profile: updated });
    }
  },
}));
