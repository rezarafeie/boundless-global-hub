
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
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "past":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "free":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "paid":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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
