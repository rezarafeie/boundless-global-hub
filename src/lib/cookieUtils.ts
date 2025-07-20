
interface DismissedNotification {
  id: number;
  dismissedAt: number;
}

export const cookieUtils = {
  // Set a cookie with expiration
  setCookie: (name: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },

  // Get a cookie value
  getCookie: (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  // Delete a cookie
  deleteCookie: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  },

  // Get dismissed notification IDs
  getDismissedNotifications: (type: 'floating' | 'popup'): number[] => {
    const cookieName = `rafiei-dismissed-${type}`;
    const cookieValue = cookieUtils.getCookie(cookieName);
    
    if (!cookieValue) return [];
    
    try {
      const dismissed: DismissedNotification[] = JSON.parse(cookieValue);
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      
      // Filter out expired dismissals (older than 30 days)
      const validDismissals = dismissed.filter(d => d.dismissedAt > thirtyDaysAgo);
      
      // Update cookie if we filtered out expired items
      if (validDismissals.length !== dismissed.length) {
        cookieUtils.setDismissedNotifications(type, validDismissals.map(d => d.id));
      }
      
      return validDismissals.map(d => d.id);
    } catch (error) {
      console.error('Error parsing dismissed notifications cookie:', error);
      return [];
    }
  },

  // Set dismissed notification IDs
  setDismissedNotifications: (type: 'floating' | 'popup', notificationIds: number[]) => {
    const cookieName = `rafiei-dismissed-${type}`;
    const now = Date.now();
    const dismissed: DismissedNotification[] = notificationIds.map(id => ({
      id,
      dismissedAt: now
    }));
    
    cookieUtils.setCookie(cookieName, JSON.stringify(dismissed), 30);
  },

  // Add a dismissed notification ID
  addDismissedNotification: (type: 'floating' | 'popup', notificationId: number) => {
    const existing = cookieUtils.getDismissedNotifications(type);
    if (!existing.includes(notificationId)) {
      const updated = [...existing, notificationId];
      cookieUtils.setDismissedNotifications(type, updated);
    }
  }
};

// Export individual functions for easier use
export const getCookie = cookieUtils.getCookie;
export const setCookie = cookieUtils.setCookie;
export const deleteCookie = cookieUtils.deleteCookie;
