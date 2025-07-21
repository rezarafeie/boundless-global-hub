// Service for handling real Lovable analytics data
export const parseRealAnalyticsData = (analyticsString: string) => {
  try {
    // Parse the structured analytics data from Lovable
    const data = {
      totalVisitors: 0,
      totalPageviews: 0,
      avgPageviewsPerVisit: 0,
      avgSessionDuration: 0,
      avgBounceRate: 0,
      pages: [] as Array<{page: string, views: number}>,
      sources: [] as Array<{source: string, visitors: number}>,
      devices: [] as Array<{device: string, visitors: number}>,
      countries: [] as Array<{country: string, visitors: number}>
    };

    // Extract data using regex patterns
    const visitorsMatch = analyticsString.match(/(\d+) visitors/);
    if (visitorsMatch) data.totalVisitors = parseInt(visitorsMatch[1]);

    const pageviewsMatch = analyticsString.match(/(\d+) pageviews/);
    if (pageviewsMatch) data.totalPageviews = parseInt(pageviewsMatch[1]);

    const pageviewsPerVisitMatch = analyticsString.match(/([\d.]+) pageviewsPerVisit/);
    if (pageviewsPerVisitMatch) data.avgPageviewsPerVisit = parseFloat(pageviewsPerVisitMatch[1]);

    const sessionDurationMatch = analyticsString.match(/(\d+) sessionDuration/);
    if (sessionDurationMatch) data.avgSessionDuration = parseInt(sessionDurationMatch[1]);

    const bounceRateMatch = analyticsString.match(/(\d+) bounceRate/);
    if (bounceRateMatch) data.avgBounceRate = parseInt(bounceRateMatch[1]);

    // Extract pages data
    const pagesPattern = /page \[(.*?)\]/;
    const pagesMatch = analyticsString.match(pagesPattern);
    if (pagesMatch) {
      const pagesData = pagesMatch[1];
      const pageMatches = pagesData.match(/\{([^}]+) (\d+)\}/g);
      if (pageMatches) {
        data.pages = pageMatches.map(match => {
          const [, page, views] = match.match(/\{([^}]+) (\d+)\}/) || [];
          return { page: page || '', views: parseInt(views) || 0 };
        });
      }
    }

    // Extract sources data
    const sourcesPattern = /source \[(.*?)\]/;
    const sourcesMatch = analyticsString.match(sourcesPattern);
    if (sourcesMatch) {
      const sourcesData = sourcesMatch[1];
      const sourceMatches = sourcesData.match(/\{([^}]+) (\d+)\}/g);
      if (sourceMatches) {
        data.sources = sourceMatches.map(match => {
          const [, source, visitors] = match.match(/\{([^}]+) (\d+)\}/) || [];
          return { source: source || '', visitors: parseInt(visitors) || 0 };
        });
      }
    }

    // Extract devices data
    const devicesPattern = /device \[(.*?)\]/;
    const devicesMatch = analyticsString.match(devicesPattern);
    if (devicesMatch) {
      const devicesData = devicesMatch[1];
      const deviceMatches = devicesData.match(/\{([^}]+) (\d+)\}/g);
      if (deviceMatches) {
        data.devices = deviceMatches.map(match => {
          const [, device, visitors] = match.match(/\{([^}]+) (\d+)\}/) || [];
          return { device: device || '', visitors: parseInt(visitors) || 0 };
        });
      }
    }

    // Extract countries data
    const countriesPattern = /country \[(.*?)\]/;
    const countriesMatch = analyticsString.match(countriesPattern);
    if (countriesMatch) {
      const countriesData = countriesMatch[1];
      const countryMatches = countriesData.match(/\{([^}]+) (\d+)\}/g);
      if (countryMatches) {
        data.countries = countryMatches.map(match => {
          const [, country, visitors] = match.match(/\{([^}]+) (\d+)\}/) || [];
          return { country: country || '', visitors: parseInt(visitors) || 0 };
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Error parsing real analytics data:', error);
    return null;
  }
};

// Convert device names to Persian
const getDeviceNameInPersian = (device: string) => {
  if (device.includes('mobile')) return 'موبایل';
  if (device.includes('desktop')) return 'دسکتاپ';
  if (device.includes('tablet')) return 'تبلت';
  if (device.includes('bot')) return 'ربات';
  return device;
};

// Convert country codes to Persian names
const getCountryNameInPersian = (country: string) => {
  const countryMap: Record<string, string> = {
    'IR': 'ایران',
    'US': 'آمریکا',
    'AF': 'افغانستان',
    'CA': 'کانادا',
    'TR': 'ترکیه',
    'DE': 'آلمان',
    'SE': 'سوئد',
    'CN': 'چین',
    'OM': 'عمان',
    'Unknown': 'نامشخص'
  };
  return countryMap[country] || country;
};

// Convert source names to Persian
const getSourceNameInPersian = (source: string) => {
  if (source.includes('instagram')) return 'اینستاگرام';
  if (source === 'Direct') return 'مستقیم';
  if (source.includes('google')) return 'گوگل';
  if (source.includes('facebook')) return 'فیسبوک';
  if (source.includes('telegram')) return 'تلگرام';
  return source;
};

// Calculate percentages
const calculatePercentages = (items: Array<{visitors?: number, views?: number}>) => {
  const total = items.reduce((sum, item) => sum + (item.visitors || item.views || 0), 0);
  return items.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round(((item.visitors || item.views || 0) / total) * 100) : 0
  }));
};

// Mock function for compatibility - this will be replaced with real data
export const readProjectAnalytics = async (
  startDate: string,
  endDate: string,
  granularity: 'hourly' | 'daily'
): Promise<any> => {
  // This function now acts as a bridge to the real analytics data
  // The actual data fetching will be done in the component using the read_project_analytics tool
  console.log('Analytics bridge called for:', { startDate, endDate, granularity });
  
  // Return a placeholder - real data will be fetched in the component
  return {
    totalVisitors: 3592,
    totalPageviews: 52969,
    avgPageviewsPerVisit: 14.75,
    avgSessionDuration: 310,
    avgBounceRate: 58
  };
};

// Helper function to get all days between two dates
function getDaysBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Current visitors estimation based on real patterns (no real-time data available)
export const getCurrentVisitors = (totalVisitors: number): number => {
  // More realistic estimate: 0.1-0.3% of weekly visitors might be online now
  const weeklyTotal = totalVisitors;
  const estimatedCurrent = Math.floor(weeklyTotal * 0.002) + Math.floor(Math.random() * 3);
  return Math.max(estimatedCurrent, 1);
};

// Export the parsing and conversion functions
export { getDeviceNameInPersian, getCountryNameInPersian, getSourceNameInPersian, calculatePercentages };