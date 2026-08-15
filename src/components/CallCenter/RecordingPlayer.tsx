import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Download, Loader2, Gauge } from 'lucide-react';
import { callCenter, formatDuration } from '@/lib/callCenterService';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

const RecordingPlayer: React.FC<{ callId: string; canDownload?: boolean }> = ({ callId, canDownload }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    callCenter.recordingUrl(callId)
      .then((res) => { if (active) setUrl(res.url); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [callId]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); } else { el.play(); setPlaying(true); }
  };

  const changeSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال آماده‌سازی فایل…</div>;
  if (error || !url) return <div className="text-sm text-muted-foreground">فایل ضبط در دسترس نیست{error ? ` (${error})` : ''}</div>;

  return (
    <div className="rounded-xl border p-3 space-y-3">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={(e) => setTime((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration || 0)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <Button size="icon" variant="secondary" onClick={toggle} className="h-10 w-10 shrink-0">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-1 space-y-1">
          <Slider
            value={[time]}
            max={duration || 1}
            step={1}
            onValueChange={([v]) => { if (audioRef.current) { audioRef.current.currentTime = v; setTime(v); } }}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono" dir="ltr">
            <span>{formatDuration(time)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={changeSpeed} className="gap-1 shrink-0">
          <Gauge className="h-4 w-4" />{speed}x
        </Button>
        {canDownload && (
          <Button size="icon" variant="ghost" asChild className="shrink-0">
            <a href={url} download target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default RecordingPlayer;
