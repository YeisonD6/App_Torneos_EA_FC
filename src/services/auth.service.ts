import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Profile } from '../types/database.types';

const MOCK_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  display_name: 'David Morales',
  gamer_tag: 'xFalcon_FC',
  role: 'participant',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const authService = {
  async signIn(email: string, pass: string) {
    if (!isSupabaseConfigured()) {
      return { user: { id: MOCK_PROFILE.id, email }, profile: MOCK_PROFILE, error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) return { user: null, profile: null, error };

    const profile = await this.getProfile(data.user.id);
    return { user: data.user, profile, error: null };
  },

  async signUp(email: string, pass: string, displayName: string, gamerTag: string) {
    if (!isSupabaseConfigured()) {
      const mock = { ...MOCK_PROFILE, display_name: displayName, gamer_tag: gamerTag };
      return { user: { id: mock.id, email }, profile: mock, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          display_name: displayName.trim(),
          gamer_tag: gamerTag.trim(),
        },
      },
    });

    if (error) return { user: null, profile: null, error };
    if (!data.user) return { user: null, profile: null, error: new Error('Usuario no retornado') };

    // Esperar y buscar perfil creado por trigger
    const profile = await this.getProfile(data.user.id);
    return { user: data.user, profile, error: null };
  },

  async signOut() {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  },

  async getCurrentSession() {
    if (!isSupabaseConfigured()) {
      return { user: { id: MOCK_PROFILE.id, email: 'demo@apex.com' }, profile: MOCK_PROFILE };
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { user: null, profile: null };
    const profile = await this.getProfile(session.user.id);
    return { user: session.user, profile };
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured()) return MOCK_PROFILE;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    if (!isSupabaseConfigured()) {
      return { ...MOCK_PROFILE, ...updates, updated_at: new Date().toISOString() };
    }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) return null;
    return data as Profile;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured()) {
      callback('SIGNED_IN', { user: { id: MOCK_PROFILE.id } });
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};
