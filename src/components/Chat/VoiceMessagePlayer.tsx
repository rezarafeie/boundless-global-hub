import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  className?: string;
  fileName?: string;
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  url,
  duration = 0,
  className,
  fileName
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate fake waveform data for visual effect
  useEffect(() => {
    const generateWaveform = () => {
      const points = 40;
      const data = Array.from({ length: points }, () => Math.random() * 0.8 + 0.2);
      setWaveformData(data);
    };
    generateWaveform();
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'voice-message.webm';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl w-full max-w-[280px]", className)}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePlayPause}
        className="h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      {/* Waveform Visualization */}
      <div className="flex-1 flex items-center gap-1 h-8 relative">
        {waveformData.map((height, index) => {
          const isActive = (index / waveformData.length) * 100 <= progress;
          const animationDelay = isPlaying ? `${index * 0.05}s` : '0s';
          return (
            <div
              key={index}
              className={cn(
                "w-1 rounded-full transition-all duration-200",
                isActive 
                  ? "bg-blue-500" 
                  : "bg-slate-300 dark:bg-slate-600",
                isPlaying && isActive && "animate-pulse"
              )}
              style={{
                height: `${height * 100}%`,
                minHeight: '2px',
                animationDelay: isPlaying && isActive ? animationDelay : undefined,
                transform: isPlaying && isActive ? `scaleY(${1 + Math.sin(Date.now() * 0.01 + index) * 0.3})` : undefined
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <div className="text-xs text-slate-600 dark:text-slate-400 min-w-[2.5rem] text-right">
        {formatTime(isPlaying ? currentTime : audioDuration)}
      </div>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Download className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default VoiceMessagePlayer;