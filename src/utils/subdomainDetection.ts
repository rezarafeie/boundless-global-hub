/**
 * Utility functions for subdomain detection and routing
 */

export const isMessengerSubdomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.startsWith('messenger.') || hostname === 'messenger.rafiei.co';
};

export const isShortlinkSubdomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.startsWith('l.') || hostname === 'l.rafiei.co';
};

export const getSubdomainType = (): 'main' | 'messenger' | 'shortlink' => {
  if (isShortlinkSubdomain()) return 'shortlink';
  if (isMessengerSubdomain()) return 'messenger';
  return 'main';
};

export const shouldShowMessengerOnly = (): boolean => {
  return isMessengerSubdomain();
};

export const shouldShowShortlinkOnly = (): boolean => {
  return isShortlinkSubdomain();
};