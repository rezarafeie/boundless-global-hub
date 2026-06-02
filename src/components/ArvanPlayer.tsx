import React from "react";

interface ArvanPlayerProps {
  configUrl: string;
  className?: string;
}

const ArvanPlayer: React.FC<ArvanPlayerProps> = ({ configUrl, className = "" }) => {
  const src = `https://player.arvancloud.ir/index.html?config=${configUrl}`;
  return (
    <div className={`relative w-full ${className}`} style={{ paddingTop: "57%" }}>
      <iframe
        src={src}
        allowFullScreen
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};

export default ArvanPlayer;
