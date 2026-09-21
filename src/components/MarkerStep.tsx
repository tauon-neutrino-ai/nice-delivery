"use client";

import { useRef, useState } from "react";
import { MarkTarget, SlotState, VideoSlot } from "@/lib/types";
import { formatTime } from "@/lib/format";

const FRAME_STEP = 1 / 30;

interface MarkerVideoRowProps {
  slot: VideoSlot;
  label: string;
  accent: "cyan" | "orange";
  state: SlotState;
  onSetMarker: (slot: VideoSlot, time: number) => void;
}

function MarkerVideoRow({ slot, label, accent, state, onSetMarker }: MarkerVideoRowProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const borderClass = accent === "cyan" ? "border-[--color-cyan]" : "border-[--color-orange]";
  const textClass = accent === "cyan" ? "text-[--color-cyan]" : "text-[--color-orange]";

  const step = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), duration);
    setCurrentTime(video.currentTime);
  };

  const togglePreview = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className={`text-sm font-bold ${textClass}`}>{label}</span>
      <div className={`aspect-video w-full overflow-hidden rounded-2xl border-2 bg-black ${borderClass}`}>
        <video
          ref={videoRef}
          src={state.src ?? undefined}
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0 text-xs text-[--color-text-muted]">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className="w-full"
          aria-label={`${label}の再生位置`}
        />
        <span className="w-10 shrink-0 text-right text-xs text-[--color-text-muted]">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => step(-FRAME_STEP)}
          className="rounded-full bg-[--color-track] px-3 py-1 text-xs text-[--color-text-primary]"
        >
          -1コマ
        </button>
        <button
          type="button"
          onClick={togglePreview}
          className="rounded-full bg-[--color-track] px-4 py-1 text-xs text-[--color-text-primary]"
        >
          {isPlaying ? "一時停止" : "プレビュー再生"}
        </button>
        <button
          type="button"
          onClick={() => step(FRAME_STEP)}
          className="rounded-full bg-[--color-track] px-3 py-1 text-xs text-[--color-text-primary]"
        >
          +1コマ
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSetMarker(slot, currentTime)}
        className={`rounded-full py-2 text-sm font-bold ${
          state.marker !== null
            ? "bg-[--color-track] text-[--color-text-primary]"
            : "bg-[--color-play-blue] text-white"
        }`}
      >
        {state.marker !== null
          ? `マーク: ${formatTime(state.marker)}(再設定)`
          : "ここでハックを蹴った"}
      </button>
    </div>
  );
}

interface MarkerStepProps {
  target: MarkTarget;
  model: SlotState;
  own: SlotState;
  onSetMarker: (slot: VideoSlot, time: number) => void;
  onNext: () => void;
}

export default function MarkerStep({ target, model, own, onSetMarker, onNext }: MarkerStepProps) {
  const showModel = target === "both" || target === "model";
  const showOwn = target === "both" || target === "own";

  const canProceed =
    target === "both"
      ? model.marker !== null && own.marker !== null
      : target === "model"
        ? model.marker !== null
        : own.marker !== null;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-xs text-[--color-text-muted]">
        ハックを蹴った瞬間にスクロールして「ここでハックを蹴った」を押してください
      </p>
      {showModel && (
        <MarkerVideoRow slot="model" label="お手本" accent="cyan" state={model} onSetMarker={onSetMarker} />
      )}
      {showOwn && (
        <MarkerVideoRow slot="own" label="あなた" accent="orange" state={own} onSetMarker={onSetMarker} />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="rounded-full bg-[--color-play-blue] py-3 text-sm font-bold text-white disabled:opacity-30"
      >
        次へ
      </button>
    </div>
  );
}
