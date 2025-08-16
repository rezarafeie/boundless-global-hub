import React from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AppViewToggleButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAppView = () => {
    // Convert current route to app view
    const currentPath = location.pathname;
    
    if (currentPath === "/" || currentPath === "/dashboard") {
      navigate("/app/dashboard");
    } else if (currentPath.startsWith("/courses/")) {
      const slug = currentPath.split("/courses/")[1];
      navigate(`/app/course/${slug}`);
    } else if (currentPath === "/tests") {
      navigate("/app/tests");
    } else if (currentPath === "/profile") {
      navigate("/app/profile");
    } else {
      // Default to app dashboard
      navigate("/app/dashboard");
    }
  };

  const handleDesktopView = () => {
    // Convert app route back to regular route
    const currentPath = location.pathname;
    
    if (currentPath === "/app/dashboard") {
      navigate("/dashboard");
    } else if (currentPath.startsWith("/app/course/")) {
      const slug = currentPath.split("/app/course/")[1];
      navigate(`/courses/${slug}`);
    } else if (currentPath === "/app/tests") {
      navigate("/tests");
    } else if (currentPath === "/app/profile") {
      navigate("/profile");
    } else {
      navigate("/");
    }
  };

  const isAppView = location.pathname.startsWith("/app/");

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={isAppView ? handleDesktopView : handleAppView}
      className="rounded-full hover:bg-accent dark:hover:bg-accent/50"
      aria-label={isAppView ? "Switch to desktop view" : "Switch to mobile app view"}
    >
      {isAppView ? (
        <Monitor size={20} className="text-foreground" />
      ) : (
        <Smartphone size={20} className="text-foreground" />
      )}
    </Button>
  );
};

export default AppViewToggleButton;