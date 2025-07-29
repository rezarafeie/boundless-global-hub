
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface RafieiUser {
  id: number;
  email?: string;
  phone: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_id: string;
  country_code: string;
  signup_source: string;
  is_approved: boolean;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthStep {
  step: 'initial' | 'login' | 'register_complete' | 'otp_verify';
  data?: any;
}

class RafieiAuthService {
  private static instance: RafieiAuthService;
  
  static getInstance(): RafieiAuthService {
    if (!RafieiAuthService.instance) {
      RafieiAuthService.instance = new RafieiAuthService();
    }
    return RafieiAuthService.instance;
  }

  // Detect if input is email or phone
  detectInputType(input: string): 'email' | 'phone' {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+98|0098|98|0)?9[0-9]{9}$/;
    
    if (emailRegex.test(input)) {
      return 'email';
    } else if (phoneRegex.test(input.replace(/\s|-/g, ''))) {
      return 'phone';
    }
    return 'phone'; // Default to phone for Iranian numbers
  }

  // Normalize phone number
  normalizePhone(phone: string): string {
    let normalized = phone.replace(/\s|-/g, '');
    
    // Remove country code prefixes and standardize to 09xxxxxxxxx format
    if (normalized.startsWith('+98')) {
      normalized = '0' + normalized.substring(3);
    } else if (normalized.startsWith('0098')) {
      normalized = '0' + normalized.substring(4);
    } else if (normalized.startsWith('98')) {
      normalized = '0' + normalized.substring(2);
    } else if (normalized.startsWith('9') && normalized.length === 10) {
      normalized = '0' + normalized;
    }
    
    return normalized;
  }

  // Check if user exists
  async checkUserExists(identifier: string): Promise<{ exists: boolean; user?: RafieiUser; type: 'email' | 'phone' }> {
    const type = this.detectInputType(identifier);
    const normalizedIdentifier = type === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    
    const { data, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq(type, normalizedIdentifier)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return {
      exists: !!data,
      user: data || undefined,
      type
    };
  }

  // Generate unique user ID
  async generateUniqueUserId(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_unique_user_id');
    
    if (error) throw error;
    return data;
  }

  // Detect country code from IP or phone
  async detectCountryCode(phone?: string, ip?: string): Promise<string> {
    if (phone) {
      const { data, error } = await supabase.rpc('detect_country_code_from_phone', { 
        phone_number: phone 
      });
      if (!error && data) return data;
    }
    
    // Default to Iran for now - can be extended with IP geolocation
    return '+98';
  }

  // Validate Iranian phone number
  async isIranianPhone(phone: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_iranian_phone', { 
      phone_number: phone 
    });
    
    if (error) return false;
    return data;
  }

  // Register new user
  async registerUser(userData: {
    email?: string;
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
    signupSource?: string;
  }): Promise<{ user: RafieiUser; session_token: string }> {
    const normalizedPhone = this.normalizePhone(userData.phone);
    const userId = await this.generateUniqueUserId();
    const countryCode = await this.detectCountryCode(userData.phone);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data: user, error } = await supabase
      .from('chat_users')
      .insert({
        email: userData.email?.toLowerCase(),
        phone: normalizedPhone,
        first_name: userData.firstName,
        last_name: userData.lastName,
        full_name: `${userData.firstName} ${userData.lastName}`,
        name: `${userData.firstName} ${userData.lastName}`,
        user_id: userId,
        password_hash: hashedPassword,
        country_code: countryCode,
        signup_source: userData.signupSource || window.location.origin,
        is_approved: true,
        role: 'user'
      })
      .select()
      .single();

    if (error) throw error;

    // Create session
    const session_token = this.generateSessionToken();
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: session_token,
        is_active: true
      });

    return { user, session_token };
  }

  // Login user
  async loginUser(identifier: string, password: string): Promise<{ user: RafieiUser; session_token: string }> {
    const type = this.detectInputType(identifier);
    const normalizedIdentifier = type === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    
    const { data: user, error } = await supabase
      .from('chat_users')
      .select('*')
      .eq(type, normalizedIdentifier)
      .single();

    if (error || !user) {
      throw new Error('کاربر یافت نشد');
    }

    if (!user.password_hash) {
      throw new Error('رمز عبور تنظیم نشده است');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('رمز عبور اشتباه است');
    }

    // Create session
    const session_token = this.generateSessionToken();
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: session_token,
        is_active: true
      });

    return { user, session_token };
  }

  // Send email OTP using Supabase Auth
  async sendEmailOTP(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) throw error;
  }

  // Send SMS OTP using existing edge function
  async sendSMSOTP(phone: string, countryCode: string = '+98'): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    
    // Skip OTP for non-Iranian users
    if (countryCode !== '+98') {
      console.log('🌍 Non-Iranian user, skipping OTP');
      return;
    }
    
    console.log('📱 Sending OTP for phone:', normalizedPhone, 'Country:', countryCode);

    // Call the existing send-otp edge function
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { 
        phone: normalizedPhone,
        countryCode: countryCode
      }
    });

    if (error) {
      throw new Error(error.message || 'خطا در ارسال کد تأیید');
    }

    return data;
  }

  // Verify OTP using existing edge function
  async verifyOTP(phone: string, otpCode: string, countryCode: string = '+98'): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    
    // Skip OTP verification for non-Iranian users
    if (countryCode !== '+98') {
      console.log('🌍 Non-Iranian user, skipping OTP verification');
      return;
    }
    
    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { 
        phone: normalizedPhone,
        otpCode: otpCode
      }
    });

    if (error || !data.success) {
      throw new Error(data?.error || 'کد تأیید نامعتبر است');
    }
  }

  // Set password for existing user
  async setPasswordForUser(identifier: string, password: string): Promise<{ user: RafieiUser; session_token: string }> {
    const type = this.detectInputType(identifier);
    const normalizedIdentifier = type === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: user, error } = await supabase
      .from('chat_users')
      .update({ password_hash: hashedPassword })
      .eq(type, normalizedIdentifier)
      .select()
      .single();

    if (error || !user) {
      throw new Error('خطا در تنظیم رمز عبور');
    }

    // Create session
    const session_token = this.generateSessionToken();
    await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: session_token,
        is_active: true
      });

    return { user, session_token };
  }

  // Generate session token
  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Validate session
  async validateSession(token: string): Promise<{ user: RafieiUser; valid: boolean } | null> {
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select(`
        user_id,
        is_active,
        chat_users (*)
      `)
      .eq('session_token', token)
      .eq('is_active', true)
      .single();

    if (error || !session) return null;

    const user = session.chat_users as any;
    return { user, valid: true };
  }

  // Store session in localStorage
  setSession(token: string, user: RafieiUser): void {
    localStorage.setItem('rafiei_session_token', token);
    localStorage.setItem('rafiei_user', JSON.stringify(user));
  }

  // Get session from localStorage
  getStoredSession(): { token: string; user: RafieiUser } | null {
    const token = localStorage.getItem('rafiei_session_token');
    const userStr = localStorage.getItem('rafiei_user');
    
    if (!token || !userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return { token, user };
    } catch {
      return null;
    }
  }

  // Clear session
  clearSession(): void {
    localStorage.removeItem('rafiei_session_token');
    localStorage.removeItem('rafiei_user');
  }

  // Logout
  async logout(token?: string): Promise<void> {
    const sessionToken = token || localStorage.getItem('rafiei_session_token');
    
    if (sessionToken) {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    }
    
    this.clearSession();
  }
}

export const rafieiAuth = RafieiAuthService.getInstance();
