interface IPInfo {
  ip: string;
  country_code: string;
  country_name: string;
  region: string;
  city: string;
  timezone: string;
}

class IPDetectionService {
  private static async getIPInfo(): Promise<IPInfo | null> {
    try {
      // Try multiple IP detection services for reliability
      const services = [
        'https://ipapi.co/json/',
        'https://api.ipgeolocation.io/ipgeo?apiKey=free'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service);
          if (response.ok) {
            const data = await response.json();
            
            // Normalize response format
            return {
              ip: data.ip,
              country_code: data.country_code || data.country_code2,
              country_name: data.country_name || data.country,
              region: data.region || data.state_prov,
              city: data.city,
              timezone: data.timezone
            };
          }
        } catch (error) {
          console.warn(`Failed to get IP info from ${service}:`, error);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error detecting IP location:', error);
      return null;
    }
  }

  static async isIranianIP(): Promise<boolean> {
    try {
      const ipInfo = await this.getIPInfo();
      
      if (!ipInfo) {
        // If we can't detect IP, assume it's not Iranian for safety
        return false;
      }
      
      // Check if country code is Iran
      return ipInfo.country_code?.toUpperCase() === 'IR';
    } catch (error) {
      console.error('Error checking Iranian IP:', error);
      // Default to false for safety
      return false;
    }
  }

  static async getUserLocation(): Promise<IPInfo | null> {
    return await this.getIPInfo();
  }
}

export { IPDetectionService };
export type { IPInfo };