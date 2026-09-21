"use client";

import { useSyncedPlayback } from "@/hooks/useSyncedPlayback";
import { VideoSlot } from "@/lib/types";
import VideoPane from "./VideoPane";
import SeekBar from "./SeekBar";
import PlayButton from "./PlayButton";
import SpeedControl from "./SpeedControl";
import MuteButton from "./MuteButton";

interface ComparePanelProps {
  modelSrc: string;
  ownSrc: string;
  modelMarker: number;
  ownMarker: number;
  onAdjustMarker: (slot: VideoSlot) => void;
  onChangeVideo: (slot: VideoSlot, file: File) => void;
}

export default function ComparePanel({
  modelSrc,
  ownSrc,
  modelMarker,
  ownMarker,
  onAdjustMarker,
  onChangeVideo,
}: ComparePanelProps) {
  const {
    modelVideoRef,
    ownVideoRef,
    ready,
    isPlaying,
    relativeTime,
    windowLength,
    playbackRate,
    muted,
    toggleMuted,
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
        onChangeVideo={(file) => onChangeVideo("model", file)}
      />
      <VideoPane
        videoRef={ownVideoRef}
        src={ownSrc}
        label="あなた"
        accent="orange"
        onLoadedMetadata={handleOwnLoadedMetadata}
        onAdjustMarker={() => onAdjustMarker("own")}
        onChangeVideo={(file) => onChangeVideo("own", file)}
      />

      <SeekBar relativeTime={relativeTime} windowLength={windowLength} onSeek={seekTo} />

      <div className="flex items-center justify-center gap-4">
        <MuteButton muted={muted} onToggle={toggleMuted} />
        <PlayButton isPlaying={isPlaying} onToggle={togglePlay} disabled={!ready} />
      </div>

      <div className="flex justify-center">
        <SpeedControl rate={playbackRate} onChange={setRate} />
      </div>
    </div>
  );
}
