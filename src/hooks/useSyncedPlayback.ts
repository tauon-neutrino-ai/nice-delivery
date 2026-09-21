"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DRIFT_THRESHOLD_S, POST_ROLL, PRE_ROLL } from "@/lib/constants";

interface UseSyncedPlaybackArgs {
  modelMarker: number;
  ownMarker: number;
}

export function useSyncedPlayback({ modelMarker, ownMarker }: UseSyncedPlaybackArgs) {
  const modelVideoRef = useRef<HTMLVideoElement | null>(null);
  const ownVideoRef = useRef<HTMLVideoElement | null>(null);

  const [modelDuration, setModelDuration] = useState<number | null>(null);
  const [ownDuration, setOwnDuration] = useState<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [relativeTime, setRelativeTime] = useState(0);
  const [muted, setMutedState] = useState(true);

  const rafIdRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});
  const playStartWallClockRef = useRef(0);
  const isPlayingRef = useRef(false);
  const playbackRateRef = useRef(1);
  const relativeTimeRef = useRef(0);
  const lastUiPushRef = useRef(0);
  const mutedRef = useRef(true);

  const ready = modelDuration !== null && ownDuration !== null;

  const { preRoll, postRoll, windowLength, modelClipStart, ownClipStart } = useMemo(() => {
    if (!ready) {
      return { preRoll: 0, postRoll: 0, windowLength: 0, modelClipStart: 0, ownClipStart: 0 };
    }
    const clampedPreRoll = Math.min(PRE_ROLL, modelMarker, ownMarker);
    const clampedPostRoll = Math.min(
      POST_ROLL,
      (modelDuration as number) - modelMarker,
      (ownDuration as number) - ownMarker
    );
    return {
      preRoll: clampedPreRoll,
      postRoll: clampedPostRoll,
      windowLength: clampedPreRoll + clampedPostRoll,
      modelClipStart: modelMarker - clampedPreRoll,
      ownClipStart: ownMarker - clampedPreRoll,
    };
  }, [ready, modelMarker, ownMarker, modelDuration, ownDuration]);

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopLoop();
    modelVideoRef.current?.pause();
    ownVideoRef.current?.pause();
  }, [stopLoop]);

  const pushRelativeTime = useCallback((value: number, force = false) => {
    relativeTimeRef.current = value;
    const now = performance.now();
    if (force || now - lastUiPushRef.current > 80) {
      lastUiPushRef.current = now;
      setRelativeTime(value);
    }
  }, []);

  const tick = useCallback(() => {
    if (!isPlayingRef.current) return;
    const modelVideo = modelVideoRef.current;
    const ownVideo = ownVideoRef.current;
    if (!modelVideo || !ownVideo) return;

    const elapsedS = ((performance.now() - playStartWallClockRef.current) / 1000) * playbackRateRef.current;
    const relative = Math.min(elapsedS, windowLength);

    const expectedModel = modelClipStart + relative;
    if (Math.abs(modelVideo.currentTime - expectedModel) > DRIFT_THRESHOLD_S) {
      modelVideo.currentTime = expectedModel;
    }
    const expectedOwn = ownClipStart + relative;
    if (Math.abs(ownVideo.currentTime - expectedOwn) > DRIFT_THRESHOLD_S) {
      ownVideo.currentTime = expectedOwn;
    }

    pushRelativeTime(relative);

    if (relative >= windowLength) {
      pause();
      pushRelativeTime(windowLength, true);
      return;
    }
    rafIdRef.current = requestAnimationFrame(() => tickRef.current());
  }, [modelClipStart, ownClipStart, windowLength, pause, pushRelativeTime]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const play = useCallback(() => {
    const modelVideo = modelVideoRef.current;
    const ownVideo = ownVideoRef.current;
    if (!modelVideo || !ownVideo || !ready) return;

    const startRelative = relativeTimeRef.current >= windowLength ? 0 : relativeTimeRef.current;
    modelVideo.currentTime = modelClipStart + startRelative;
    ownVideo.currentTime = ownClipStart + startRelative;
    modelVideo.playbackRate = playbackRateRef.current;
    ownVideo.playbackRate = playbackRateRef.current;
    modelVideo.muted = mutedRef.current;
    ownVideo.muted = mutedRef.current;
    modelVideo.play().catch((err) => console.error("model video play failed", err));
    ownVideo.play().catch((err) => console.error("own video play failed", err));

    playStartWallClockRef.current = performance.now() - (startRelative / playbackRateRef.current) * 1000;
    isPlayingRef.current = true;
    setIsPlaying(true);
    stopLoop();
    rafIdRef.current = requestAnimationFrame(() => tickRef.current());
  }, [ready, windowLength, modelClipStart, ownClipStart, stopLoop]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const seekTo = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(target, 0), windowLength);
      const modelVideo = modelVideoRef.current;
      const ownVideo = ownVideoRef.current;
      const wasPlaying = isPlayingRef.current;

      if (wasPlaying) {
        stopLoop();
      }
      if (modelVideo) modelVideo.currentTime = modelClipStart + clamped;
      if (ownVideo) ownVideo.currentTime = ownClipStart + clamped;
      pushRelativeTime(clamped, true);

      if (wasPlaying) {
        playStartWallClockRef.current = performance.now() - (clamped / playbackRateRef.current) * 1000;
        rafIdRef.current = requestAnimationFrame(() => tickRef.current());
      }
    },
    [windowLength, modelClipStart, ownClipStart, stopLoop, pushRelativeTime]
  );

  const setRate = useCallback((rate: number) => {
    const currentRelative = relativeTimeRef.current;
    playStartWallClockRef.current = performance.now() - (currentRelative / rate) * 1000;
    playbackRateRef.current = rate;
    setPlaybackRateState(rate);
    if (modelVideoRef.current) modelVideoRef.current.playbackRate = rate;
    if (ownVideoRef.current) ownVideoRef.current.playbackRate = rate;
  }, []);

  const setMuted = useCallback((value: boolean) => {
    mutedRef.current = value;
    setMutedState(value);
    if (modelVideoRef.current) modelVideoRef.current.muted = value;
    if (ownVideoRef.current) ownVideoRef.current.muted = value;
  }, []);

  const toggleMuted = useCallback(() => setMuted(!mutedRef.current), [setMuted]);

  const handleModelLoadedMetadata = useCallback(() => {
    setModelDuration(modelVideoRef.current?.duration ?? null);
  }, []);
  const handleOwnLoadedMetadata = useCallback(() => {
    setOwnDuration(ownVideoRef.current?.duration ?? null);
  }, []);

  // Seek both videos to their pre-roll frame as soon as the clip window is known,
  // so the compare screen shows the right starting frame before Play is ever pressed.
  useEffect(() => {
    if (!ready) return;
    if (modelVideoRef.current) {
      modelVideoRef.current.currentTime = modelClipStart;
      modelVideoRef.current.muted = mutedRef.current;
    }
    if (ownVideoRef.current) {
      ownVideoRef.current.currentTime = ownClipStart;
      ownVideoRef.current.muted = mutedRef.current;
    }
    pushRelativeTime(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, modelClipStart, ownClipStart]);

  useEffect(() => stopLoop, [stopLoop]);

  return {
    modelVideoRef,
    ownVideoRef,
    ready,
    isPlaying,
    relativeTime,
    windowLength,
    preRoll,
    postRoll,
    playbackRate,
    muted,
    toggleMuted,
    togglePlay,
    seekTo,
    setRate,
    handleModelLoadedMetadata,
    handleOwnLoadedMetadata,
  };
}
