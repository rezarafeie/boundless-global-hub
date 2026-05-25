
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isMessengerSubdomain } from './utils/subdomainDetection'

// Update manifest and title for messenger subdomain
if (isMessengerSubdomain()) {
  // Update manifest
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink) {
    manifestLink.href = '/messenger-manifest.json';
  } else {
    // Create manifest link if it doesn't exist
    const newManifestLink = document.createElement('link');
    newManifestLink.rel = 'manifest';
    newManifestLink.href = '/messenger-manifest.json';
    document.head.appendChild(newManifestLink);
  }
  
  // Update title
  document.title = 'پیام‌رسان رفیعی | Rafiei Messenger';
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 'پیام‌رسان رفیعی - پلتفرم ارتباطی حرفه‌ای برای گروه‌ها و پیام‌های خصوصی');
  }
}

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });

      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames
            .filter((cacheName) => cacheName.startsWith('rafiei-academy'))
            .forEach((cacheName) => caches.delete(cacheName));
        });
      }

      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered successfully:', registration.scope);
        registration.update();
      })
      .catch((registrationError) => {
        console.log('SW registration failed:', registrationError);
      });
  });
}
