import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackPageview } from "@/lib/analyticsTracker";

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Track on route changes
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
