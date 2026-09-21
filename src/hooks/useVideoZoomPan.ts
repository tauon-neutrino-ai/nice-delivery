"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Touch as ReactTouch } from "react";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "@/lib/constants";

interface Point {
  x: number;
  y: number;
}

function distance(a: ReactTouch, b: ReactTouch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function midpointOf(a: ReactTouch, b: ReactTouch, containerRect: DOMRect): Point {
  return {
    x: (a.clientX + b.clientX) / 2 - containerRect.left - containerRect.width / 2,
    y: (a.clientY + b.clientY) / 2 - containerRect.top - containerRect.height / 2,
  };
}

export function useVideoZoomPan() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });

  const gestureRef = useRef<{
    mode: "pinch" | "pan" | null;
    startScale: number;
    startTranslate: Point;
    startDistance: number;
    startMidpoint: Point;
    startTouch: Point;
  }>({
    mode: null,
    startScale: 1,
    startTranslate: { x: 0, y: 0 },
    startDistance: 0,
    startMidpoint: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
  });

  const clampTranslate = useCallback((point: Point, forScale: number): Point => {
    const container = containerRef.current;
    if (!container) return point;
    const rect = container.getBoundingClientRect();
    const maxX = (rect.width * (forScale - 1)) / 2;
    const maxY = (rect.height * (forScale - 1)) / 2;
    return {
      x: Math.min(Math.max(point.x, -maxX), maxX),
      y: Math.min(Math.max(point.y, -maxY), maxY),
    };
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    if (e.touches.length === 2) {
      const rect = container.getBoundingClientRect();
      gestureRef.current = {
        mode: "pinch",
        startScale: scale,
        startTranslate: translate,
        startDistance: distance(e.touches[0], e.touches[1]),
        startMidpoint: midpointOf(e.touches[0], e.touches[1], rect),
        startTouch: { x: 0, y: 0 },
      };
    } else if (e.touches.length === 1 && scale > 1) {
      gestureRef.current = {
        mode: "pan",
        startScale: scale,
        startTranslate: translate,
        startDistance: 0,
        startMidpoint: { x: 0, y: 0 },
        startTouch: { x: e.touches[0].clientX, y: e.touches[0].clientY },
      };
    }
  }, [scale, translate]);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (gesture.mode === "pinch" && e.touches.length === 2) {
      e.preventDefault();
      const newDistance = distance(e.touches[0], e.touches[1]);
      const factor = newDistance / gesture.startDistance;
      const newScale = Math.min(Math.max(gesture.startScale * factor, MIN_ZOOM), MAX_ZOOM);
      const m = gesture.startMidpoint;
      const ratio = newScale / gesture.startScale;
      const newTranslate = clampTranslate(
        {
          x: m.x - (m.x - gesture.startTranslate.x) * ratio,
          y: m.y - (m.y - gesture.startTranslate.y) * ratio,
        },
        newScale
      );
      setScale(newScale);
      setTranslate(newTranslate);
    } else if (gesture.mode === "pan" && e.touches.length === 1) {
      e.preventDefault();
      const dx = e.touches[0].clientX - gesture.startTouch.x;
      const dy = e.touches[0].clientY - gesture.startTouch.y;
      setTranslate(
        clampTranslate(
          { x: gesture.startTranslate.x + dx, y: gesture.startTranslate.y + dy },
          gesture.startScale
        )
      );
    }
  }, [clampTranslate]);

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      gestureRef.current.mode = null;
    }
  }, []);

  const applyScale = useCallback(
    (newScale: number) => {
      const clampedScale = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM);
      setScale(clampedScale);
      if (clampedScale === MIN_ZOOM) {
        setTranslate({ x: 0, y: 0 });
      } else {
        setTranslate((prev) => clampTranslate(prev, clampedScale));
      }
    },
    [clampTranslate]
  );

  const zoomIn = useCallback(() => applyScale(scale + ZOOM_STEP), [applyScale, scale]);
  const zoomOut = useCallback(() => applyScale(scale - ZOOM_STEP), [applyScale, scale]);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      applyScale(scale - e.deltaY * 0.01);
    },
    [applyScale, scale]
  );

  const style = useMemo(
    () => ({
      transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
      transformOrigin: "center",
    }),
    [translate, scale]
  );

  return {
    containerRef,
    scale,
    style,
    zoomIn,
    zoomOut,
    touchHandlers: { onTouchStart, onTouchMove, onTouchEnd, onWheel },
  };
}
