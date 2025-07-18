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
    <div className={cn("flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl min-w-[200px] max-w-[240px]", className)}>
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
        className="h-7 w-7 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3 ml-0.5" />
        )}
      </Button>

      {/* Waveform Visualization */}
      <div className="flex-1 flex items-center gap-0.5 h-6 relative min-w-0">
        {waveformData.slice(0, 30).map((height, index) => {
          const isActive = (index / 30) * 100 <= progress;
          const animatedHeight = isPlaying && isActive 
            ? height * (1 + Math.sin(Date.now() * 0.01 + index * 0.5) * 0.3)
            : height;
          return (
            <div
              key={index}
              className={cn(
                "w-0.5 rounded-full transition-all duration-100 flex-shrink-0",
                isActive 
                  ? "bg-blue-500" 
                  : "bg-slate-300 dark:bg-slate-600"
              )}
              style={{
                height: `${animatedHeight * 80 + 20}%`,
                minHeight: '2px'
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <div className="text-xs text-slate-600 dark:text-slate-400 min-w-[2rem] text-right flex-shrink-0">
        {formatTime(isPlaying ? currentTime : audioDuration)}
      </div>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="h-5 w-5 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
      >
        <Download className="w-2.5 h-2.5" />
      </Button>
    </div>
  );
};

export default VoiceMessagePlayer;