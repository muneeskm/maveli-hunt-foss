"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function TestingPage() {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.6), 3.5));
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers (1-finger pan, 2-finger pinch to zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      panStart.current = { ...pan };
      lastTouchDist.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      lastTouchDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const delta = (currentDist - lastTouchDist.current) * 0.005;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.6), 3.5));
      lastTouchDist.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDist.current = null;
  };

  // Double tap to quick zoom in/out
  const lastTap = useRef<number>(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setScale((prev) => (prev > 1.2 ? 1 : 1.8));
      setPan({ x: 0, y: 0 });
    }
    lastTap.current = now;
  };

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-[#020712] overflow-hidden select-none p-0 sm:p-4">
      {/* Device Frame Viewport Container */}
      <div
        className="relative flex h-full max-h-[100dvh] sm:max-h-[920px] w-auto items-center justify-center overflow-hidden"
        style={{
          aspectRatio: "576 / 1024",
          maxHeight: "100dvh",
          maxWidth: "100vw",
        }}
      >
        {/* Layer 1: The Interactive Scrollable & Zoomable Map Element */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleDoubleTap}
          onWheel={handleWheel}
          className="absolute inset-0 z-10 flex cursor-grab items-center justify-center active:cursor-grabbing touch-none overflow-hidden"
          style={{
            // Inner display cutout padding to align map neatly behind HUD bezel
            paddingTop: "5.5%",
            paddingBottom: "14%",
            paddingLeft: "4%",
            paddingRight: "4%",
          }}
        >
          <div
            className="relative will-change-transform transition-transform duration-75 ease-out flex items-center justify-center h-full w-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "center center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/testing-map.jpg"
              alt="Maveli Hunt Timeline Map"
              draggable={false}
              className="h-full w-full object-cover select-none pointer-events-none rounded-[12px]"
            />
          </div>
        </div>

        {/* Layer 2: The Cyberpunk Maveli Tracker Border Overlay Frame */}
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/testing-frame.png"
            alt="Maveli Tracker HUD Frame"
            className="h-full w-full object-fill drop-shadow-[0_0_25px_rgba(37,99,235,0.4)]"
          />
        </div>
      </div>
    </div>
  );
}
