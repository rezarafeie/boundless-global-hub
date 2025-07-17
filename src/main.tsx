
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isMessengerSubdomain } from './utils/subdomainDetection'

// Update manifest and title for messenger subdomain
if (isMessengerSubdomain()) {
  // Update manifest
  const manifestLink = document.getElementById('manifest-link') as HTMLLinkElement;
  if (manifestLink) {
    manifestLink.href = '/messenger-manifest.json';
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

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swFile = isMessengerSubdomain() ? '/messenger-sw.js' : '/sw.js';
    navigator.serviceWorker.register(swFile)
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
