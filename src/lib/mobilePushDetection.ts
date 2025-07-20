export interface MobileDeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browser: string;
  osVersion: string;
  isPWA: boolean;
  supportsWebPush: boolean;
  limitations: string[];
  recommendations: string[];
}

export const detectMobileCapabilities = (): MobileDeviceInfo => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  }

  // Extract OS version
  let osVersion = 'Unknown';
  if (isIOS) {
    const match = userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}`;
    }
  } else if (isAndroid) {
    const match = userAgent.match(/Android (\d+\.?\d*)/);
    if (match) {
      osVersion = match[1];
    }
  }

  // Check if running as PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;

  // Determine web push support and limitations
  let supportsWebPush = false;
  const limitations: string[] = [];
  const recommendations: string[] = [];

  if (isIOS) {
    // iOS Web Push is very limited
    const iosVersionNumber = parseFloat(osVersion);
    
    if (iosVersionNumber >= 16.4 && browser === 'Safari' && isPWA) {
      supportsWebPush = true;
      limitations.push('فقط در حالت PWA (نصب روی صفحه اصلی)');
      recommendations.push('برای بهترین تجربه، سایت را به صفحه اصلی اضافه کنید');
    } else {
      supportsWebPush = false;
      if (browser !== 'Safari') {
        limitations.push('مرورگرهای غیر از Safari در iOS از اعلان‌ها پشتیبانی نمی‌کنند');
        recommendations.push('از مرورگر Safari استفاده کنید');
      }
      if (iosVersionNumber < 16.4) {
        limitations.push(`iOS ${osVersion} از اعلان‌های وب پشتیبانی نمی‌کند (نیاز iOS 16.4+)`);
        recommendations.push('سیستم عامل خود را به iOS 16.4 یا بالاتر بروزرسانی کنید');
      }
      if (!isPWA && iosVersionNumber >= 16.4) {
        limitations.push('نیاز به نصب سایت روی صفحه اصلی (PWA)');
        recommendations.push('سایت را به صفحه اصلی اضافه کنید تا اعلان‌ها فعال شود');
      }
      recommendations.push('برای اعلان‌های کامل، اپلیکیشن موبایل را نصب کنید');
    }
  } else if (isAndroid) {
    // Android generally supports web push in modern browsers
    if (browser === 'Chrome' || browser === 'Firefox' || browser === 'Edge') {
      supportsWebPush = true;
      if (!window.isSecureContext) {
        limitations.push('نیاز به اتصال امن (HTTPS)');
      }
    } else {
      supportsWebPush = false;
      limitations.push('مرورگر انتخابی از اعلان‌ها پشتیبانی نمی‌کند');
      recommendations.push('از Chrome، Firefox یا Edge استفاده کنید');
    }
  } else if (isMobile) {
    // Other mobile platforms
    supportsWebPush = 'serviceWorker' in navigator && 'Notification' in window && window.isSecureContext;
    if (!supportsWebPush) {
      limitations.push('مرورگر انتخابی از اعلان‌ها پشتیبانی نمی‌کند');
      recommendations.push('مرورگر خود را بروزرسانی کنید');
    }
  } else {
    // Desktop - generally good support
    supportsWebPush = 'serviceWorker' in navigator && 'Notification' in window && window.isSecureContext;
  }

  // Add general recommendations for mobile users
  if (isMobile && (!supportsWebPush || limitations.length > 0)) {
    recommendations.push('برای بهترین تجربه اعلان‌ها، اپلیکیشن موبایل را نصب کنید');
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    browser,
    osVersion,
    isPWA,
    supportsWebPush,
    limitations,
    recommendations
  };
};

export const getOneSignalConfig = (deviceInfo: MobileDeviceInfo) => {
  const baseConfig = {
    appId: "e221c080-7853-46e5-ba40-93796318d1a0",
    allowLocalhostAsSecureOrigin: true,
    autoResubscribe: true,
    notificationClickHandlerAction: 'focus',
  };

  if (deviceInfo.isIOS) {
    return {
      ...baseConfig,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
      autoRegister: false, // Manual registration for iOS
      persistNotification: false,
      safari_web_id: "web.onesignal.auto.e221c080-7853-46e5-ba40-93796318d1a0",
      welcomeNotification: {
        disable: true // Disable welcome notification on iOS
      }
    };
  } else if (deviceInfo.isAndroid) {
    return {
      ...baseConfig,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
      autoRegister: true, // Auto-register for Android
      persistNotification: true,
      welcomeNotification: {
        disable: false,
        title: "اعلان‌های بدون مرز فعال شد",
        message: "شما اعلان‌های جدید را دریافت خواهید کرد",
        url: ""
      }
    };
  } else {
    // Desktop/other
    return {
      ...baseConfig,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
      autoRegister: true,
      persistNotification: false,
      welcomeNotification: {
        disable: false,
        title: "اعلان‌های بدون مرز فعال شد",
        message: "شما اعلان‌های جدید را دریافت خواهید کرد",
        url: ""
      }
    };
  }
};
