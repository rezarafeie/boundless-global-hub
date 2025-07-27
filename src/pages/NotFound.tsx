
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SmartFallback from "@/components/SmartFallback";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.log(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    console.log("Attempting smart fallback to auth.rafiei.co");
  }, [location.pathname]);

  return <SmartFallback />;
};

export default NotFound;
