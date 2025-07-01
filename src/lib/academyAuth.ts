
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface AcademyUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AcademyCourse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  type: 'free' | 'paid';
  price?: number;
  status: 'active' | 'closed' | 'full';
  redirect_after_enroll?: string;
  features?: any[];
  created_at: string;
  updated_at: string;
}

export interface AcademyEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'enrolled' | 'completed';
  enrolled_at: string;
  completed_at?: string;
}

export interface AcademyTransaction {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  gateway: string;
  status: 'success' | 'pending' | 'failed';
  gateway_transaction_id?: string;
  created_at: string;
}

class AcademyAuthService {
  async checkUserExists(identifier: string): Promise<{ exists: boolean; user?: AcademyUser }> {
    const isEmail = identifier.includes('@');
    const field = isEmail ? 'email' : 'phone';
    
    const { data, error } = await supabase
      .from('academy_users')
      .select('*')
      .eq(field, identifier)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      exists: !!data,
      user: data || undefined
    };
  }

  async signup(userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ user: AcademyUser; error?: string }> {
    try {
      // Hash password
      const password_hash = await bcrypt.hash(userData.password, 10);

      // Create Supabase auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone
          }
        }
      });

      if (authError || !authData.user) {
        throw authError || new Error('Failed to create auth user');
      }

      // Insert into academy_users with the same ID
      const { data, error } = await supabase
        .from('academy_users')
        .insert({
          id: authData.user.id,
          ...userData,
          password_hash
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { user: data };
    } catch (error: any) {
      return { user: null as any, error: error.message };
    }
  }

  async login(identifier: string, password: string): Promise<{ user: AcademyUser; error?: string }> {
    try {
      // Find user by email or phone
      const { exists, user } = await this.checkUserExists(identifier);
      
      if (!exists || !user) {
        return { user: null as any, error: 'کاربر یافت نشد' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return { user: null as any, error: 'رمز عبور اشتباه است' };
      }

      // Sign in with Supabase auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (authError) {
        throw authError;
      }

      return { user };
    } catch (error: any) {
      return { user: null as any, error: error.message };
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<AcademyUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data } = await supabase
      .from('academy_users')
      .select('*')
      .eq('id', user.id)
      .single();

    return data;
  }

  async enrollUserInCourse(userId: string, courseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('academy_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'شما قبلاً در این دوره ثبت‌نام کرده‌اید' };
        }
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSettings(): Promise<{ use_old_auth_system: boolean; enrollment_enabled: boolean }> {
    const { data } = await supabase
      .from('academy_settings')
      .select('use_old_auth_system, enrollment_enabled')
      .eq('id', 1)
      .single();

    return data || { use_old_auth_system: true, enrollment_enabled: true };
  }
}

export const academyAuth = new AcademyAuthService();
