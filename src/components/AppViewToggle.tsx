import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Monitor, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AppViewToggle = () => {
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
    <Card className="fixed bottom-4 right-4 z-50 shadow-lg">
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {isAppView ? "نمای موبایل" : "نمای دسکتاپ"}
          </div>
          <Button
            variant={isAppView ? "default" : "outline"}
            size="sm"
            onClick={isAppView ? handleDesktopView : handleAppView}
            className="h-8 px-3"
          >
            {isAppView ? (
              <>
                <Monitor size={14} className="ml-1" />
                <span className="hidden sm:inline">دسکتاپ</span>
              </>
            ) : (
              <>
                <Smartphone size={14} className="ml-1" />
                <span className="hidden sm:inline">موبایل</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppViewToggle;