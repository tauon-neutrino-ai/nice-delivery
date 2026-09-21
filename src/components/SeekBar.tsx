import { formatTime } from "@/lib/format";

interface SeekBarProps {
  relativeTime: number;
  windowLength: number;
  onSeek: (value: number) => void;
}

export default function SeekBar({ relativeTime, windowLength, onSeek }: SeekBarProps) {
  const remaining = Math.max(windowLength - relativeTime, 0);
  return (
    <div className="flex w-full items-center gap-3">
      <span className="w-9 shrink-0 text-xs text-[--color-text-muted]">
        {formatTime(relativeTime)}
      </span>
      <input
        type="range"
        min={0}
        max={windowLength || 0}
        step={0.01}
        value={relativeTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full"
        aria-label="再生位置"
      />
      <span className="w-9 shrink-0 text-right text-xs text-[--color-text-muted]">
        {formatTime(remaining)}
      </span>
    </div>
  );
}
