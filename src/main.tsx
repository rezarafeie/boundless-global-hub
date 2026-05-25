
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

// Register single service worker for PWA with mobile optimization
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Always use the main service worker (consolidated)
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered successfully:', registration.scope);
        
        // Mobile-specific service worker handling
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          console.log('Mobile device detected - service worker optimized for mobile');
          
          // Force update on mobile for immediate changes
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available on mobile - updating');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed:', registrationError);
      });
  });
}
