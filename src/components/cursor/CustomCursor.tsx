'use client';

import React, { useEffect, useState, useRef } from 'react';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [visible, setVisible] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only enable on desktop/fine-pointer devices
    const isFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

    if (!isFinePointer) {
      return;
    }

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = target.closest('a, button, input, textarea, select, [role="button"], .interactive-cursor');
        setHovered(!!isInteractive);
      }
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);
    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth lerp loop
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const render = () => {
      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, 0.35);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, 0.35);

      if (cursorRef.current) {
        // Hotspot offset: tip is at x ~ 3px of a 24px wide image
        const offsetX = 3;
        const offsetY = 0;
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x - offsetX}px, ${currentPos.current.y - offsetY}px, 0)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    rafId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible]);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 left-0 z-[99999] transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ willChange: 'transform' }}
    >
      <div
        className={`transition-transform duration-100 ease-out origin-top-left ${
          hovered ? 'scale-125' : clicked ? 'scale-90' : 'scale-100'
        }`}
      >
        <img
          src="/assets/cursor-cropped.png"
          alt=""
          className="w-6 h-auto drop-shadow-md select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
