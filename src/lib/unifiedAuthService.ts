
import { supabase } from '@/integrations/supabase/client';
import { messengerService, type MessengerUser } from '@/lib/messengerService';
import bcrypt from 'bcryptjs';

export interface UnifiedUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  username?: string;
  isAcademyUser: boolean;
  isMessengerUser: boolean;
  messengerData?: MessengerUser;
  academyData?: any;
}

export interface UnifiedAuthResult {
  user: UnifiedUser;
  sessionToken: string;
  isNewUser: boolean;
}

class UnifiedAuthService {
  // Check if user exists in either system by phone/email
  async findUserByCredentials(phone: string, email?: string, countryCode?: string): Promise<UnifiedUser | null> {
    try {
      // Check messenger users first
      const messengerUser = await messengerService.getUserByPhone(phone, countryCode || '+98');
      
      // Check academy users
      const { data: academyUser } = await supabase
        .from('academy_users')
        .select('*')
        .or(`phone.eq.${phone}${email ? `,email.eq.${email}` : ''}`)
        .single();

      if (!messengerUser && !academyUser) {
        return null;
      }

      // Create unified user object
      const unifiedUser: UnifiedUser = {
        id: messengerUser?.id?.toString() || academyUser?.id || '',
        name: messengerUser?.name || `${academyUser?.first_name} ${academyUser?.last_name}` || '',
        firstName: messengerUser?.first_name || academyUser?.first_name || '',
        lastName: messengerUser?.last_name || academyUser?.last_name || '',
        email: messengerUser?.email || academyUser?.email || '',
        phone: messengerUser?.phone || academyUser?.phone || phone,
        countryCode: messengerUser?.country_code || countryCode || '+98',
        username: messengerUser?.username,
        isAcademyUser: !!academyUser,
        isMessengerUser: !!messengerUser,
        messengerData: messengerUser || undefined,
        academyData: academyUser || undefined
      };

      return unifiedUser;
    } catch (error) {
      console.error('Error finding user by credentials:', error);
      return null;
    }
  }

  // Authenticate user with password
  async authenticateUser(phone: string, password: string, countryCode: string = '+98'): Promise<UnifiedAuthResult | null> {
    try {
      const user = await this.findUserByCredentials(phone, undefined, countryCode);
      
      if (!user) {
        return null;
      }

      let passwordValid = false;
      let sessionToken = '';

      // Check messenger password if user exists in messenger
      if (user.isMessengerUser && user.messengerData) {
        const messengerAuth = await messengerService.loginWithPassword(phone, password);
        if (messengerAuth && messengerAuth.user) {
          passwordValid = true;
          sessionToken = messengerAuth.session_token || '';
        }
      }

      // If not authenticated via messenger, check academy password
      if (!passwordValid && user.isAcademyUser && user.academyData) {
        // Academy users use Supabase Auth - we need to implement this
        // For now, we'll create a basic password check
        if (user.academyData.password_hash) {
          passwordValid = await bcrypt.compare(password, user.academyData.password_hash);
          if (passwordValid) {
            // Create session for academy user
            sessionToken = await this.createUnifiedSession(user);
          }
        }
      }

      if (!passwordValid) {
        return null;
      }

      return {
        user,
        sessionToken,
        isNewUser: false
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  // Register new user in both systems
  async registerUser(userData: {
    firstName: string;
    lastName: string;
    phone: string;
    countryCode: string;
    email: string;
    password: string;
    username?: string;
  }): Promise<UnifiedAuthResult | null> {
    try {
      const { firstName, lastName, phone, countryCode, email, password, username } = userData;
      
      // Check if user already exists
      const existingUser = await this.findUserByCredentials(phone, email, countryCode);
      if (existingUser) {
        throw new Error('User already exists');
      }

      const fullName = `${firstName} ${lastName}`;
      
      // Register in messenger system
      const messengerResult = await messengerService.registerWithPassword({
        name: fullName,
        phone,
        countryCode,
        username: username || `user_${phone.slice(-6)}`,
        password,
        isBoundlessStudent: false,
        firstName,
        lastName
      });

      // Register in academy system
      const { data: academyUser, error: academyError } = await supabase
        .from('academy_users')
        .insert([{
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          role: 'student'
        }])
        .select()
        .single();

      if (academyError) {
        console.error('Error creating academy user:', academyError);
      }

      // Create unified user object
      const unifiedUser: UnifiedUser = {
        id: messengerResult.user.id.toString(),
        name: fullName,
        firstName,
        lastName,
        email,
        phone,
        countryCode,
        username: messengerResult.user.username,
        isAcademyUser: !!academyUser,
        isMessengerUser: true,
        messengerData: messengerResult.user,
        academyData: academyUser || undefined
      };

      return {
        user: unifiedUser,
        sessionToken: messengerResult.session_token,
        isNewUser: true
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  // Sync user data between systems
  async syncUserData(user: UnifiedUser): Promise<void> {
    try {
      // If user exists in messenger but not academy, create academy profile
      if (user.isMessengerUser && !user.isAcademyUser && user.messengerData) {
        const { error } = await supabase
          .from('academy_users')
          .insert([{
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email,
            phone: user.phone,
            role: 'student'
          }]);

        if (!error) {
          user.isAcademyUser = true;
        }
      }

      // If user exists in academy but not messenger, create messenger profile
      if (user.isAcademyUser && !user.isMessengerUser && user.academyData) {
        // This would require creating a messenger account
        // For now, we'll skip this as it requires a password
        console.log('Academy user needs messenger account creation');
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  // Create unified session
  private async createUnifiedSession(user: UnifiedUser): Promise<string> {
    try {
      const sessionToken = `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create session in user_sessions table
      const { error } = await supabase
        .from('user_sessions')
        .insert([{
          session_token: sessionToken,
          user_id: parseInt(user.id),
          is_active: true,
          last_activity: new Date().toISOString()
        }]);

      if (error) {
        throw error;
      }

      return sessionToken;
    } catch (error) {
      console.error('Error creating unified session:', error);
      throw error;
    }
  }

  // Validate session and return user
  async validateSession(sessionToken: string): Promise<UnifiedUser | null> {
    try {
      console.log('Validating session token:', sessionToken.substring(0, 10) + '...');
      
      // First check if it's a messenger session
      const isValidMessenger = await messengerService.validateSession(sessionToken);
      
      if (isValidMessenger) {
        console.log('Valid messenger session found');
        
        // Get user from session token
        const { data: sessionData } = await supabase
          .from('user_sessions')
          .select('user_id')
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .single();

        if (sessionData) {
          const { data: messengerUser } = await supabase
            .from('chat_users')
            .select('*')
            .eq('id', sessionData.user_id)
            .single();

          if (messengerUser) {
            const unifiedUser = await this.createUnifiedUserFromMessenger(messengerUser);
            await this.syncUserData(unifiedUser);
            return unifiedUser;
          }
        } else {
          // If no session data but messenger validation passed, try to get user by token
          // This might be a new session
          console.log('No session data found, but messenger validation passed');
        }
      }

      // Check unified sessions (for academy users or other custom sessions)
      const { data: unifiedSession } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (unifiedSession) {
        // Get user from chat_users or academy_users
        const { data: chatUser } = await supabase
          .from('chat_users')
          .select('*')
          .eq('id', unifiedSession.user_id)
          .single();

        if (chatUser) {
          return await this.createUnifiedUserFromMessenger(chatUser);
        }
      }

      console.log('No valid session found');
      return null;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  // Create unified user object from messenger user
  private async createUnifiedUserFromMessenger(messengerUser: any): Promise<UnifiedUser> {
    // Check if academy user exists
    const { data: academyUser } = await supabase
      .from('academy_users')
      .select('*')
      .or(`phone.eq.${messengerUser.phone},email.eq.${messengerUser.email}`)
      .single();

    return {
      id: messengerUser.id.toString(),
      name: messengerUser.name || `${messengerUser.first_name} ${messengerUser.last_name}`,
      firstName: messengerUser.first_name || '',
      lastName: messengerUser.last_name || '',
      email: messengerUser.email || '',
      phone: messengerUser.phone || '',
      countryCode: messengerUser.country_code || '+98',
      username: messengerUser.username,
      isAcademyUser: !!academyUser,
      isMessengerUser: true,
      messengerData: messengerUser,
      academyData: academyUser || undefined
    };
  }

  // Logout from all systems
  async logout(sessionToken: string): Promise<void> {
    try {
      // Deactivate messenger session
      await messengerService.deactivateSession(sessionToken);
      
      // Deactivate unified session
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}

export const unifiedAuthService = new UnifiedAuthService();
