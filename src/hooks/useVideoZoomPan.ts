"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Touch as ReactTouch } from "react";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "@/lib/constants";

interface Point {
  x: number;
  y: number;
}

const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MAX_INTERVAL_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE_PX = 30;
const TAP_MAX_DURATION_MS = 300;
const TAP_MAX_MOVEMENT_PX = 10;

function touchDistance(a: ReactTouch, b: ReactTouch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function touchMidpoint(a: ReactTouch, b: ReactTouch, rect: DOMRect): Point {
  return {
    x: (a.clientX + b.clientX) / 2 - rect.left - rect.width / 2,
    y: (a.clientY + b.clientY) / 2 - rect.top - rect.height / 2,
  };
}

export function useVideoZoomPan() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });

  const scaleRef = useRef(1);
  const translateRef = useRef<Point>({ x: 0, y: 0 });

  const touchGestureRef = useRef<{
    mode: "pinch" | "pan" | null;
    startScale: number;
    startTranslate: Point;
    startDistance: number;
    startMidpoint: Point;
    startTouch: Point;
    startTime: number;
  }>({
    mode: null,
    startScale: 1,
    startTranslate: { x: 0, y: 0 },
    startDistance: 0,
    startMidpoint: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
    startTime: 0,
  });
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const mouseDragRef = useRef<{ dragging: boolean; start: Point; startTranslate: Point }>({
    dragging: false,
    start: { x: 0, y: 0 },
    startTranslate: { x: 0, y: 0 },
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

  const applyState = useCallback((newScale: number, newTranslate: Point) => {
    scaleRef.current = newScale;
    translateRef.current = newTranslate;
    setScale(newScale);
    setTranslate(newTranslate);
  }, []);

  const applyScale = useCallback(
    (newScale: number) => {
      const clampedScale = Math.min(Math.max(newScale, MIN_ZOOM), MAX_ZOOM);
      const newTranslate =
        clampedScale === MIN_ZOOM ? { x: 0, y: 0 } : clampTranslate(translateRef.current, clampedScale);
      applyState(clampedScale, newTranslate);
    },
    [applyState, clampTranslate]
  );

  const zoomIn = useCallback(() => applyScale(scaleRef.current + ZOOM_STEP), [applyScale]);
  const zoomOut = useCallback(() => applyScale(scaleRef.current - ZOOM_STEP), [applyScale]);

  /** Zoom in/out anchored at a specific point (container-relative, origin at center), preserving that point under the cursor/finger. */
  const zoomToggleAtPoint = useCallback(
    (point: Point) => {
      if (scaleRef.current > 1) {
        applyState(MIN_ZOOM, { x: 0, y: 0 });
        return;
      }
      const targetScale = Math.min(DOUBLE_TAP_ZOOM, MAX_ZOOM);
      const ratio = targetScale / scaleRef.current;
      const anchored = {
        x: point.x - (point.x - translateRef.current.x) * ratio,
        y: point.y - (point.y - translateRef.current.y) * ratio,
      };
      applyState(targetScale, clampTranslate(anchored, targetScale));
    },
    [applyState, clampTranslate]
  );

  const pointFromClient = useCallback((clientX: number, clientY: number): Point => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  }, []);

  // --- Touch: pinch to zoom, single-finger drag to pan, double-tap to zoom to point ---

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    if (e.touches.length === 2) {
      const rect = container.getBoundingClientRect();
      touchGestureRef.current = {
        mode: "pinch",
        startScale: scaleRef.current,
        startTranslate: translateRef.current,
        startDistance: touchDistance(e.touches[0], e.touches[1]),
        startMidpoint: touchMidpoint(e.touches[0], e.touches[1], rect),
        startTouch: { x: 0, y: 0 },
        startTime: performance.now(),
      };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchGestureRef.current = {
        mode: scaleRef.current > 1 ? "pan" : null,
        startScale: scaleRef.current,
        startTranslate: translateRef.current,
        startDistance: 0,
        startMidpoint: { x: 0, y: 0 },
        startTouch: { x: t.clientX, y: t.clientY },
        startTime: performance.now(),
      };
    }
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const gesture = touchGestureRef.current;
      if (gesture.mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const newDistance = touchDistance(e.touches[0], e.touches[1]);
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
        applyState(newScale, newTranslate);
      } else if (gesture.mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - gesture.startTouch.x;
        const dy = e.touches[0].clientY - gesture.startTouch.y;
        const newTranslate = clampTranslate(
          { x: gesture.startTranslate.x + dx, y: gesture.startTranslate.y + dy },
          gesture.startScale
        );
        applyState(gesture.startScale, newTranslate);
      }
    },
    [applyState, clampTranslate]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const gesture = touchGestureRef.current;
      if (e.touches.length === 0) {
        const changed = e.changedTouches[0];
        const elapsed = performance.now() - gesture.startTime;
        const moved = changed ? Math.hypot(changed.clientX - gesture.startTouch.x, changed.clientY - gesture.startTouch.y) : Infinity;
        const wasTap = gesture.mode !== "pinch" && elapsed < TAP_MAX_DURATION_MS && moved < TAP_MAX_MOVEMENT_PX && changed;

        if (wasTap && changed) {
          const point = pointFromClient(changed.clientX, changed.clientY);
          const lastTap = lastTapRef.current;
          const now = performance.now();
          if (
            lastTap &&
            now - lastTap.time < DOUBLE_TAP_MAX_INTERVAL_MS &&
            Math.hypot(point.x - lastTap.x, point.y - lastTap.y) < DOUBLE_TAP_MAX_DISTANCE_PX
          ) {
            zoomToggleAtPoint(point);
            lastTapRef.current = null;
          } else {
            lastTapRef.current = { x: point.x, y: point.y, time: now };
          }
        }
        touchGestureRef.current.mode = null;
      }
    },
    [pointFromClient, zoomToggleAtPoint]
  );

  // --- Mouse (desktop): drag to pan when zoomed in, double-click to zoom to point ---

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (scaleRef.current <= 1) return;
    mouseDragRef.current = {
      dragging: true,
      start: { x: e.clientX, y: e.clientY },
      startTranslate: translateRef.current,
    };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const drag = mouseDragRef.current;
      if (!drag.dragging) return;
      const dx = e.clientX - drag.start.x;
      const dy = e.clientY - drag.start.y;
      const newTranslate = clampTranslate(
        { x: drag.startTranslate.x + dx, y: drag.startTranslate.y + dy },
        scaleRef.current
      );
      applyState(scaleRef.current, newTranslate);
    },
    [applyState, clampTranslate]
  );

  const endMouseDrag = useCallback(() => {
    mouseDragRef.current.dragging = false;
  }, []);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      zoomToggleAtPoint(pointFromClient(e.clientX, e.clientY));
    },
    [pointFromClient, zoomToggleAtPoint]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      applyScale(scaleRef.current - e.deltaY * 0.01);
    },
    [applyScale]
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
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp: endMouseDrag,
      onMouseLeave: endMouseDrag,
      onDoubleClick,
      onWheel,
    },
  };
}
