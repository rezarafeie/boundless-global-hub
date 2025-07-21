// Service for handling Lovable analytics data
export const readProjectAnalytics = async (
  startDate: string,
  endDate: string,
  granularity: 'hourly' | 'daily'
): Promise<any[]> => {
  try {
    // This is a mock implementation since we don't have access to the actual analytics API
    // In a real implementation, this would call the analytics API endpoint
    
    const days = getDaysBetween(new Date(startDate), new Date(endDate));
    
    // Generate mock data for each day
    const mockData = days.map(date => ({
      date: date.toISOString().split('T')[0],
      visitors: Math.floor(Math.random() * 200) + 50,
      pageviews: Math.floor(Math.random() * 500) + 150,
      bounceRate: Math.floor(Math.random() * 40) + 30,
      avgSessionDuration: Math.floor(Math.random() * 300) + 120,
      newVisitors: Math.floor(Math.random() * 80) + 20,
      returningVisitors: Math.floor(Math.random() * 120) + 30
    }));
    
    return mockData;
  } catch (error) {
    console.error('Error reading project analytics:', error);
    throw error;
  }
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

// Real-time analytics simulation
export const getCurrentVisitors = (): number => {
  // Simulate real-time visitor count
  return Math.floor(Math.random() * 25) + 5;
};

// Get analytics summary for dashboard
export const getAnalyticsSummary = async (): Promise<{
  totalVisitors: number;
  totalPageviews: number;
  avgBounceRate: number;
  avgSessionDuration: number;
}> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const data = await readProjectAnalytics(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      'daily'
    );
    
    const summary = {
      totalVisitors: data.reduce((sum, day) => sum + day.visitors, 0),
      totalPageviews: data.reduce((sum, day) => sum + day.pageviews, 0),
      avgBounceRate: data.reduce((sum, day) => sum + day.bounceRate, 0) / data.length,
      avgSessionDuration: data.reduce((sum, day) => sum + day.avgSessionDuration, 0) / data.length
    };
    
    return summary;
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw error;
  }
};