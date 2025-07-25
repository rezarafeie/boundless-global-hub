import { useState } from 'react';
import { createShortLink } from '@/lib/urlShortener';

export const useShortenUrl = () => {
  const [isLoading, setIsLoading] = useState(false);

  const shortenUrl = async (originalUrl: string): Promise<string> => {
    if (!originalUrl || !originalUrl.startsWith('http')) {
      return originalUrl;
    }

    setIsLoading(true);
    try {
      const shortLink = await createShortLink({
        original_url: originalUrl
      });
      
      if (shortLink) {
        return `${window.location.origin}/s/${shortLink.slug}`;
      }
      return originalUrl;
    } catch (error) {
      console.error('Error shortening URL:', error);
      return originalUrl;
    } finally {
      setIsLoading(false);
    }
  };

  return { shortenUrl, isLoading };
};