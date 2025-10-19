import { createServerClient, getCurrentUser } from '@/lib/supabase/server';
import type { Profile } from '@/lib/profile';

export class ProfileServerService {
  static async getCurrentProfile(): Promise<Profile | null> {
    try {
      // Get current authenticated user from Supabase
      const user = await getCurrentUser();
      
      if (!user) {
        console.log('[ProfileServerService] No authenticated user');
        return null;
      }

      console.log('[ProfileServerService] Fetching profile for user:', user.id);

      // Get Supabase server client
      const supabase = await createServerClient();

      // Fetch profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[ProfileServerService] Error fetching profile:', profileError);
        return null;
      }

      console.log('[ProfileServerService] Profile fetched successfully');
      return profile as Profile;
    } catch (error) {
      console.error('[ProfileServerService] Unexpected error fetching profile:', error);
      return null;
    }
  }

  static async getProfileByUsername(username: string): Promise<Profile | null> {
    try {
      const supabase = await createServerClient();

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[ProfileServerService] Error fetching profile by username:', error);
        return null;
      }

      return profile as Profile;
    } catch (error) {
      console.error('[ProfileServerService] Unexpected error:', error);
      return null;
    }
  }

  static async getPublicProfile(userId: string): Promise<Profile | null> {
    try {
      const supabase = await createServerClient();

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          bio,
          avatar_url,
          role,
          is_online,
          reputation_score,
          expertise_areas,
          years_of_experience,
          grade_level,
          subjects_of_interest,
          is_verified,
          created_at,
          last_seen_at
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[ProfileServerService] Error fetching public profile:', error);
        return null;
      }

      return profile as Profile;
    } catch (error) {
      console.error('[ProfileServerService] Unexpected error:', error);
      return null;
    }
  }
}
