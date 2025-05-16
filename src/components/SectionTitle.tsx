
import React from "react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left" | "right";
}

const SectionTitle = ({
  title,
  subtitle,
  align = "center",
}: SectionTitleProps) => {
  const alignClass = {
    center: "text-center mx-auto",
    left: "text-left",
    right: "text-right",
  };

  return (
    <div className={`max-w-3xl ${alignClass[align]} mb-12`}>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
