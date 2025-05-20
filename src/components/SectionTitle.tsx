
import React from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left" | "right";
  isWhite?: boolean;
  isCentered?: boolean;
}

const SectionTitle = ({
  title,
  subtitle,
  align = "center",
  isWhite = false,
  isCentered = false,
}: SectionTitleProps) => {
  const alignClass = {
    center: "text-center mx-auto",
    left: "text-left",
    right: "text-right",
  };

  return (
    <div className={`max-w-3xl ${alignClass[align]} mb-12 ${isCentered ? "mx-auto" : ""}`}>
      <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isWhite ? "text-white" : ""}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-lg ${isWhite ? "text-white/80" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
