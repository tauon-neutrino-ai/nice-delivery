"use client";

import { ChangeEvent, RefObject } from "react";
import { useVideoZoomPan } from "@/hooks/useVideoZoomPan";

interface VideoPaneProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  label: string;
  accent: "cyan" | "orange";
  onLoadedMetadata: () => void;
  onAdjustMarker: () => void;
  onChangeVideo: (file: File) => void;
}

const accentClasses = {
  cyan: "border-(--color-cyan) text-(--color-cyan)",
  orange: "border-(--color-orange) text-(--color-orange)",
};

export default function VideoPane({
  videoRef,
  src,
  label,
  accent,
  onLoadedMetadata,
  onAdjustMarker,
  onChangeVideo,
}: VideoPaneProps) {
  const { containerRef, scale, style, zoomIn, zoomOut, handlers } = useVideoZoomPan();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChangeVideo(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <div
          ref={containerRef}
          className={`aspect-video w-full touch-none overflow-hidden rounded-xl border-2 bg-black select-none ${accentClasses[accent]} ${
            scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          {...handlers}
        >
          <video
            ref={videoRef}
            src={src}
            playsInline
            muted
            preload="metadata"
            onLoadedMetadata={onLoadedMetadata}
            className="h-full w-full object-cover"
            style={style}
            draggable={false}
          />
        </div>

        <span
          className={`pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold ${
            accentClasses[accent]
          }`}
        >
          {label}
        </span>

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
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] text-(--color-text-muted)">
        <label className="cursor-pointer underline decoration-dotted underline-offset-2">
          動画を変更
          <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        </label>
        <span aria-hidden="true">・</span>
        <button
          type="button"
          onClick={onAdjustMarker}
          className="underline decoration-dotted underline-offset-2"
        >
          マーカーを調整
        </button>
      </div>
    </div>
  );
}
