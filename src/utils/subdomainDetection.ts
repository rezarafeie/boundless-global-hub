/**
 * Utility functions for subdomain detection and routing
 */

export const isMessengerSubdomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.startsWith('messenger.') || hostname === 'messenger.rafiei.co';
};

export const getSubdomainType = (): 'main' | 'messenger' => {
  return isMessengerSubdomain() ? 'messenger' : 'main';
};

export const shouldShowMessengerOnly = (): boolean => {
  return isMessengerSubdomain();
};