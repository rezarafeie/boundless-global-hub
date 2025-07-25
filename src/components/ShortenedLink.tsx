import { useState, useEffect } from 'react';
import { useShortenUrl } from '@/hooks/useShortenUrl';

interface ShortenedLinkProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export const ShortenedLink = ({ url, children, className, target, rel }: ShortenedLinkProps) => {
  const [shortUrl, setShortUrl] = useState(url);
  const { shortenUrl } = useShortenUrl();

  useEffect(() => {
    const createShortUrl = async () => {
      if (url && url.length > 50) {
        const shortened = await shortenUrl(url);
        setShortUrl(shortened);
      }
    };
    
    createShortUrl();
  }, [url, shortenUrl]);

  return (
    <a 
      href={url}
      target={target}
      rel={rel}
      className={className}
    >
      {children}
    </a>
  );
};