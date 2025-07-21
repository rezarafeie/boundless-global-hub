
// Session storage utility for unified session management
import { MessengerUser } from '@/types/supabase';

export interface SessionData {
  sessionToken: string;
  user: MessengerUser;
  expiresAt: string;
}

export class SessionStorage {
  private static readonly SESSION_TOKEN_KEY = 'messenger_session_token';
  private static readonly SESSION_USER_KEY = 'messenger_user';
  private static readonly SESSION_EXPIRES_KEY = 'session_expires_at';

  // Save session to both localStorage and cookies
  static saveSession(sessionToken: string, user: MessengerUser, expirationDays = 30): void {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    try {
      // Save to localStorage
      localStorage.setItem(this.SESSION_TOKEN_KEY, sessionToken);
      localStorage.setItem(this.SESSION_USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.SESSION_EXPIRES_KEY, expiresAt.toISOString());
      
      // Save to cookies with proper expiration
      this.setCookie(this.SESSION_TOKEN_KEY, sessionToken, expirationDays);
      this.setCookie(this.SESSION_USER_KEY, encodeURIComponent(JSON.stringify(user)), expirationDays);
      this.setCookie(this.SESSION_EXPIRES_KEY, expiresAt.toISOString(), expirationDays);
      
      console.log('✅ Session saved to localStorage and cookies');
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  }

  // Get session from localStorage or cookies
  static getSession(): SessionData | null {
    try {
      // Try localStorage first
      let sessionToken = localStorage.getItem(this.SESSION_TOKEN_KEY);
      let userStr = localStorage.getItem(this.SESSION_USER_KEY);
      let expiresAt = localStorage.getItem(this.SESSION_EXPIRES_KEY);

      // Fallback to cookies if localStorage is empty
      if (!sessionToken) {
        sessionToken = this.getCookie(this.SESSION_TOKEN_KEY);
        userStr = this.getCookie(this.SESSION_USER_KEY);
        expiresAt = this.getCookie(this.SESSION_EXPIRES_KEY);
        
        if (userStr) {
          userStr = decodeURIComponent(userStr);
        }
      }

      if (!sessionToken || !userStr || !expiresAt) {
        return null;
      }

      // Check if session is expired
      if (new Date() > new Date(expiresAt)) {
        console.log('Session expired, clearing data');
        this.clearSession();
        return null;
      }

      const user = JSON.parse(userStr) as MessengerUser;
      return { sessionToken, user, expiresAt };
    } catch (error) {
      console.error('❌ Error getting session:', error);
      this.clearSession();
      return null;
    }
  }

  // Clear session from both localStorage and cookies
  static clearSession(): void {
    try {
      // Clear localStorage
      localStorage.removeItem(this.SESSION_TOKEN_KEY);
      localStorage.removeItem(this.SESSION_USER_KEY);
      localStorage.removeItem(this.SESSION_EXPIRES_KEY);
      
      // Clear cookies
      this.deleteCookie(this.SESSION_TOKEN_KEY);
      this.deleteCookie(this.SESSION_USER_KEY);
      this.deleteCookie(this.SESSION_EXPIRES_KEY);
      
      console.log('✅ Session cleared from localStorage and cookies');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }

  // Check if session exists and is valid
  static hasValidSession(): boolean {
    return this.getSession() !== null;
  }

  // Refresh session expiration
  static refreshSession(expirationDays = 30): boolean {
    const session = this.getSession();
    if (!session) return false;

    this.saveSession(session.sessionToken, session.user, expirationDays);
    return true;
  }

  // Cookie utilities
  private static setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private static getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private static deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
