"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Pixel = { x: number; y: number; delay: number; size: number; phase: number; alpha: number };

export default function PixelCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!host || !canvas || !context || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pixels: Pixel[] = [];
    let progress = 0;
    let target = 0;
    let frame = 0;
    let previous = 0;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const maxDistance = Math.hypot(width / 2, height / 2) || 1;
      pixels = [];
      for (let x = 0; x < width; x += 12) {
        for (let y = 0; y < height; y += 12) {
          pixels.push({
            x, y,
            delay: Math.hypot(x - width / 2, y - height / 2) / maxDistance * 0.7,
            size: 2 + Math.random() * 4,
            phase: Math.random() * Math.PI * 2,
            alpha: 0.3 + Math.random() * 0.55,
          });
        }
      }
    };
    const tick = (now: number) => {
      const elapsed = Math.min(now - (previous || now), 50);
      previous = now;
      progress = target
        ? Math.min(1, progress + elapsed / 550)
        : Math.max(0, progress - elapsed / 350);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = getComputedStyle(host).getPropertyValue("--accent").trim();
      for (const pixel of pixels) {
        const reveal = Math.min(1, Math.max(0, (progress - pixel.delay) * 4));
        if (!reveal) continue;
        context.globalAlpha = pixel.alpha * reveal;
        const size = pixel.size * reveal * (0.85 + 0.15 * Math.sin(now / 220 + pixel.phase));
        context.fillRect(pixel.x, pixel.y, size, size);
      }
      context.globalAlpha = 1;
      frame = target || progress ? requestAnimationFrame(tick) : 0;
    };
    const animate = (value: number) => {
      target = value;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const enter = () => animate(1);
    const leave = () => animate(0);
    const focusOut = (event: FocusEvent) => {
      if (!host.contains(event.relatedTarget as Node)) leave();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("focusin", enter);
    host.addEventListener("focusout", focusOut);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focusin", enter);
      host.removeEventListener("focusout", focusOut);
    };
  }, []);

  return <div className="pixel-card" ref={ref}><canvas ref={canvasRef} aria-hidden="true" />{children}</div>;
}
