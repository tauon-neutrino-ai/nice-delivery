"use client";

import { RefObject } from "react";
import { useVideoZoomPan } from "@/hooks/useVideoZoomPan";

interface VideoPaneProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  label: string;
  accent: "cyan" | "orange";
  onLoadedMetadata: () => void;
  onAdjustMarker: () => void;
}

const accentClasses = {
  cyan: "border-[--color-cyan] text-[--color-cyan]",
  orange: "border-[--color-orange] text-[--color-orange]",
};

export default function VideoPane({
  videoRef,
  src,
  label,
  accent,
  onLoadedMetadata,
  onAdjustMarker,
}: VideoPaneProps) {
  const { containerRef, scale, style, zoomIn, zoomOut, touchHandlers } = useVideoZoomPan();

  return (
    <div className="flex items-stretch gap-2">
      <div
        className={`flex w-6 shrink-0 items-center justify-center text-xs font-bold ${accentClasses[accent]}`}
        style={{ writingMode: "vertical-rl" }}
      >
        {label}
      </div>
      <div className="relative min-w-0 flex-1">
        <div
          ref={containerRef}
          className={`aspect-video w-full touch-none overflow-hidden rounded-2xl border-2 bg-black ${accentClasses[accent]}`}
          {...touchHandlers}
        >
          <video
            ref={videoRef}
            src={src}
            playsInline
            preload="metadata"
            onLoadedMetadata={onLoadedMetadata}
            className="h-full w-full object-cover"
            style={style}
          />
        </div>
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="拡大"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white"
          >
            +
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="縮小"
            disabled={scale <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white disabled:opacity-30"
          >
            −
          </button>
        </div>
        <button
          type="button"
          onClick={onAdjustMarker}
          className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white"
        >
          マーカーを調整
        </button>
      </div>
    </div>
  );
}
