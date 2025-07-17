import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { voiceRecorder } from '@/lib/voiceRecorderService';
import { cn } from '@/lib/utils';

interface VoiceRecorderButtonProps {
  onVoiceRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

const VoiceRecorderButton: React.FC<VoiceRecorderButtonProps> = ({
  onVoiceRecorded,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    voiceRecorder.setOnDataAvailable((blob) => {
      onVoiceRecorded(blob);
      setIsRecording(false);
    });
  }, [onVoiceRecorded]);

  const handleStartRecording = async () => {
    try {
      await voiceRecorder.startRecording();
      setIsRecording(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Recording failed:', error);
      setHasPermission(false);
    }
  };

  const handleStopRecording = () => {
    voiceRecorder.stopRecording();
    setIsRecording(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasPermission) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-red-500"
        title="دسترسی به میکروفن ندارید"
      >
        <MicOff className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <span className="text-xs text-red-500 font-mono">
          {formatTime(recordingTime)}
        </span>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        className={cn(
          "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          isRecording && "text-red-500 animate-pulse"
        )}
        title={isRecording ? "پایان ضبط" : "شروع ضبط صدا"}
      >
        {isRecording ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default VoiceRecorderButton;