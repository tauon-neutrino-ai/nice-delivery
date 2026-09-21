"use client";

import { useSyncedPlayback } from "@/hooks/useSyncedPlayback";
import { VideoSlot } from "@/lib/types";
import VideoPane from "./VideoPane";
import SeekBar from "./SeekBar";
import PlayButton from "./PlayButton";
import SpeedControl from "./SpeedControl";

interface ComparePanelProps {
  modelSrc: string;
  ownSrc: string;
  modelMarker: number;
  ownMarker: number;
  onAdjustMarker: (slot: VideoSlot) => void;
}

export default function ComparePanel({
  modelSrc,
  ownSrc,
  modelMarker,
  ownMarker,
  onAdjustMarker,
}: ComparePanelProps) {
  const {
    modelVideoRef,
    ownVideoRef,
    ready,
    isPlaying,
    relativeTime,
    windowLength,
    playbackRate,
    togglePlay,
    seekTo,
    setRate,
    handleModelLoadedMetadata,
    handleOwnLoadedMetadata,
  } = useSyncedPlayback({ modelMarker, ownMarker });

  return (
    <div className="flex flex-col gap-4">
      <VideoPane
        videoRef={modelVideoRef}
        src={modelSrc}
        label="お手本"
        accent="cyan"
        onLoadedMetadata={handleModelLoadedMetadata}
        onAdjustMarker={() => onAdjustMarker("model")}
      />
      <VideoPane
        videoRef={ownVideoRef}
        src={ownSrc}
        label="参加者"
        accent="orange"
        onLoadedMetadata={handleOwnLoadedMetadata}
        onAdjustMarker={() => onAdjustMarker("own")}
      />

      <SeekBar relativeTime={relativeTime} windowLength={windowLength} onSeek={seekTo} />

      <div className="flex justify-center">
        <PlayButton isPlaying={isPlaying} onToggle={togglePlay} disabled={!ready} />
      </div>

      <div className="flex justify-center">
        <SpeedControl rate={playbackRate} onChange={setRate} />
      </div>
    </div>
  );
}
