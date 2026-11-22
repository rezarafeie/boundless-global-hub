
import React from "react";
import { cn } from "@/lib/utils";

interface CourseStatusBadgeProps {
  status: "active" | "upcoming" | "past" | "free" | "paid";
  className?: string;
}

const CourseStatusBadge: React.FC<CourseStatusBadgeProps> = ({ status, className }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "upcoming":
        return "bg-muted text-foreground border-border";
      case "past":
        return "bg-muted text-foreground border-border";
      case "free":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "paid":
        return "bg-muted text-foreground border-border";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "active":
        return "در حال برگزاری";
      case "upcoming":
        return "به زودی";
      case "past":
        return "دوره‌های گذشته";
      case "free":
        return "رایگان";
      case "paid":
        return "ویژه";
      default:
        return "";
    }
  };

  return (
    <span className={cn(`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`, className)}>
      {getStatusText()}
    </span>
  );
};

export default CourseStatusBadge;
