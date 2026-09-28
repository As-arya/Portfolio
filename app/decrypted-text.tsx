"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$";

export default function DecryptedText({ text, replayLabel }: { text: string; replayLabel: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [display, setDisplay] = useState(text);

  const replay = useCallback(() => {
    window.clearInterval(timer.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(text);
      return;
    }
    let step = 0;
    timer.current = window.setInterval(() => {
      step++;
      const settled = Math.floor(step / 2);
      setDisplay([...text].map((char, index) =>
        char === " " || index < settled ? char : glyphs[Math.floor(Math.random() * glyphs.length)],
      ).join(""));
      if (settled >= text.length) window.clearInterval(timer.current);
    }, 45);
  }, [text]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) replay();
      else {
        window.clearInterval(timer.current);
        setDisplay(text);
      }
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearInterval(timer.current);
    };
  }, [replay, text]);

  return (
    <button type="button" ref={ref} className="decrypted-text" aria-label={replayLabel}
      onMouseEnter={replay} onFocus={replay} onClick={replay}>
      <span className="decrypted-text-measure" aria-hidden="true">{text}</span>
      <span className="decrypted-text-animated" aria-hidden="true">{display}</span>
    </button>
  );
}
