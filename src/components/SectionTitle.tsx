
import React from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left" | "right";
  isWhite?: boolean;
  isCentered?: boolean;
  icon?: React.ReactNode;
}

const SectionTitle = ({
  title,
  subtitle,
  align = "center",
  isWhite = false,
  isCentered = false,
  icon
}: SectionTitleProps) => {
  const alignClass = {
    center: "text-center mx-auto",
    left: "text-left",
    right: "text-right",
  };

  return (
    <div className={`max-w-3xl ${alignClass[align]} mb-12 ${isCentered ? "mx-auto" : ""}`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${
          isWhite ? "text-white" : "text-foreground"
        }`}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className={`text-lg ${
          isWhite ? "text-white/80" : "text-muted-foreground"
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
