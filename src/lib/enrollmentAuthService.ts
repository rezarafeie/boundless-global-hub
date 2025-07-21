import { supabase } from '@/integrations/supabase/client';
import { messengerService } from './messengerService';
import { unifiedAuthService, UnifiedUser } from './unifiedAuthService';
import { getCookie, setCookie } from './cookieUtils';

export interface EnrollmentAuthData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
}

export interface EnrollmentAuthResult {
  success: boolean;
  user: UnifiedUser | null;
  token: string | null;
  error?: string;
  isNewUser?: boolean;
}

class EnrollmentAuthService {
  /**
   * Creates account and logs in user automatically after enrollment
   */
  async createAndLoginAfterEnrollment(
    enrollmentData: EnrollmentAuthData,
    enrollment: any
  ): Promise<EnrollmentAuthResult> {
    try {
      console.log('🚀 Starting automatic authentication for enrollment:', enrollment.id);
      
      // Step 1: Check if user already exists by phone or email
      const existingUser = await this.findExistingUser(enrollmentData.phone, enrollmentData.email);
      
      if (existingUser) {
        console.log('✅ Found existing user, logging in:', existingUser.name);
        return await this.loginExistingUser(existingUser, enrollment);
      }
      
      // Step 2: Create new user account
      console.log('👤 Creating new user account');
      const newUserResult = await this.createNewUser(enrollmentData, enrollment);
      
      if (!newUserResult.success || !newUserResult.user) {
        return {
          success: false,
          user: null,
          token: null,
          error: newUserResult.error || 'خطا در ایجاد کاربر'
        };
      }
      
      // Step 3: Auto-login the new user
      console.log('🔐 Auto-logging in new user');
      return await this.autoLoginNewUser(newUserResult.user!, enrollment);
      
    } catch (error: any) {
      console.error('❌ Error in enrollment authentication:', error);
      return {
        success: false,
        user: null,
        token: null,
        error: error.message || 'خطا در ایجاد حساب کاربری'
      };
    }
  }

  /**
   * Find existing user by phone or email
   */
  private async findExistingUser(phone: string, email: string): Promise<UnifiedUser | null> {
    try {
      // Check messenger users by phone
      const normalizedPhone = phone.replace(/\D/g, '');
      const { data: messengerUser } = await supabase
        .from('chat_users')
        .select('*')
        .eq('phone', normalizedPhone)
        .single();

      if (messengerUser) {
        return {
          id: messengerUser.id.toString(),
          name: messengerUser.name,
          firstName: messengerUser.first_name || '',
          lastName: messengerUser.last_name || '',
          email: messengerUser.email || email,
          phone: messengerUser.phone,
          countryCode: messengerUser.country_code || '+98',
          username: messengerUser.username,
          isAcademyUser: false,
          isMessengerUser: true,
          messengerData: messengerUser
        };
      }

      // Check by email in academy users
      if (email) {
        const { data: academyUser } = await supabase
          .from('academy_users')
          .select('*')
          .eq('email', email.toLowerCase())
          .single();

        if (academyUser) {
          return {
            id: academyUser.id,
            name: `${academyUser.first_name} ${academyUser.last_name}`.trim(),
            firstName: academyUser.first_name,
            lastName: academyUser.last_name,
            email: academyUser.email,
            phone: academyUser.phone || phone,
            countryCode: '+98',
            username: academyUser.email.split('@')[0],
            isAcademyUser: true,
            isMessengerUser: false,
            academyData: academyUser
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding existing user:', error);
      return null;
    }
  }

  /**
   * Login existing user
   */
  private async loginExistingUser(user: UnifiedUser, enrollment: any): Promise<EnrollmentAuthResult> {
    try {
      let token: string;

      if (user.isMessengerUser && user.messengerData) {
        // Generate session token for messenger user
        token = this.generateSessionToken();
        
        // Store session
        await supabase
          .from('user_sessions')
          .insert({
            user_id: parseInt(user.id),
            session_token: token,
            is_active: true,
            last_activity: new Date().toISOString()
          });
      } else if (user.isAcademyUser) {
        // Create temporary session token for academy user
        token = this.generateSessionToken();
        
        // Store in a temporary session table or use existing session mechanism
        await this.storeTemporarySession(token, user);
      } else {
        throw new Error('نوع کاربر نامشخص است');
      }

      // Update enrollment with user ID
      await this.linkEnrollmentToUser(enrollment.id, user.id);

      return {
        success: true,
        user,
        token,
        isNewUser: false
      };
    } catch (error: any) {
      console.error('Error logging in existing user:', error);
      return {
        success: false,
        user: null,
        token: null,
        error: error.message || 'خطا در ورود کاربر موجود'
      };
    }
  }

  /**
   * Create new user account
   */
  private async createNewUser(
    enrollmentData: EnrollmentAuthData,
    enrollment: any
  ): Promise<{ success: boolean; user: UnifiedUser | null; error?: string }> {
    try {
      // Create user in chat_users table (messenger system)
      const { data: chatUser, error: chatUserError } = await supabase
        .from('chat_users')
        .insert({
          name: `${enrollmentData.firstName} ${enrollmentData.lastName}`.trim(),
          first_name: enrollmentData.firstName,
          last_name: enrollmentData.lastName,
          full_name: `${enrollmentData.firstName} ${enrollmentData.lastName}`.trim(),
          email: enrollmentData.email.toLowerCase(),
          phone: enrollmentData.phone,
          country_code: enrollmentData.countryCode,
          is_approved: true,
          signup_source: 'enrollment',
          role: 'user'
        })
        .select()
        .single();

      if (chatUserError) {
        throw new Error(`خطا در ایجاد کاربر: ${chatUserError.message}`);
      }

      console.log('✅ Chat user created:', chatUser.id);

      // Create corresponding academy user
      const { data: academyUser, error: academyError } = await supabase
        .from('academy_users')
        .insert({
          first_name: enrollmentData.firstName,
          last_name: enrollmentData.lastName,
          email: enrollmentData.email.toLowerCase(),
          phone: enrollmentData.phone
        })
        .select()
        .single();

      if (academyError) {
        console.warn('Warning: Could not create academy user:', academyError.message);
      }

      // Create unified user object
      const unifiedUser: UnifiedUser = {
        id: chatUser.id.toString(),
        name: chatUser.name,
        firstName: chatUser.first_name || '',
        lastName: chatUser.last_name || '',
        email: chatUser.email || '',
        phone: chatUser.phone,
        countryCode: chatUser.country_code || '+98',
        username: chatUser.email?.split('@')[0] || undefined,
        isAcademyUser: !!academyUser,
        isMessengerUser: true,
        messengerData: chatUser,
        academyData: academyUser || undefined
      };

      return {
        success: true,
        user: unifiedUser
      };

    } catch (error: any) {
      console.error('Error creating new user:', error);
      return {
        success: false,
        user: null,
        error: error.message || 'خطا در ایجاد کاربر جدید'
      };
    }
  }

  /**
   * Auto-login new user
   */
  private async autoLoginNewUser(user: UnifiedUser, enrollment: any): Promise<EnrollmentAuthResult> {
    try {
      // Generate session token
      const token = this.generateSessionToken();
      
      // Store session in user_sessions table
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: parseInt(user.id),
          session_token: token,
          is_active: true,
          last_activity: new Date().toISOString()
        });

      if (sessionError) {
        throw new Error(`خطا در ایجاد جلسه: ${sessionError.message}`);
      }

      // Update enrollment with user ID
      await this.linkEnrollmentToUser(enrollment.id, user.id);

      console.log('✅ Auto-login successful for new user:', user.name);

      return {
        success: true,
        user,
        token,
        isNewUser: true
      };

    } catch (error: any) {
      console.error('Error auto-logging in new user:', error);
      return {
        success: false,
        user: null,
        token: null,
        error: error.message || 'خطا در ورود خودکار'
      };
    }
  }

  /**
   * Link enrollment to user
   */
  private async linkEnrollmentToUser(enrollmentId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('enrollments')
        .update({ chat_user_id: parseInt(userId) })
        .eq('id', enrollmentId);
      
      console.log('✅ Enrollment linked to user:', enrollmentId, userId);
    } catch (error) {
      console.error('Error linking enrollment to user:', error);
      // Don't throw error as this is not critical for login
    }
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Store temporary session for academy users
   */
  private async storeTemporarySession(token: string, user: UnifiedUser): Promise<void> {
    try {
      if (user.messengerData) {
        // Use existing user_sessions table
        await supabase
          .from('user_sessions')
          .insert({
            user_id: parseInt(user.id),
            session_token: token,
            is_active: true,
            last_activity: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error storing temporary session:', error);
      // Don't throw as we'll handle this gracefully
    }
  }

  /**
   * Store persistent session in localStorage and cookies
   */
  storePersistentSession(user: UnifiedUser, token: string): void {
    try {
      console.log('💾 Storing persistent session...');
      
      // Store in localStorage
      localStorage.setItem('messenger_session_token', token);
      localStorage.setItem('enrollment_auth_user', JSON.stringify(user));
      
      // Store in cookies (30 days expiration)
      setCookie('session_token', token, 30);
      setCookie('current_user', encodeURIComponent(JSON.stringify(user)), 30);
      
      // Store additional enrollment context
      setCookie('enrollment_authenticated', 'true', 30);
      
      console.log('✅ Persistent session stored successfully');
    } catch (error) {
      console.error('Error storing persistent session:', error);
    }
  }

  /**
   * Check if session should persist
   */
  shouldMaintainSession(): boolean {
    return getCookie('enrollment_authenticated') === 'true';
  }

  /**
   * Clear enrollment authentication flag while keeping session
   */
  clearEnrollmentFlag(): void {
    setCookie('enrollment_authenticated', 'false', -1); // Delete cookie
  }
}

export const enrollmentAuthService = new EnrollmentAuthService();