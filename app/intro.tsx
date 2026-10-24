"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCopy } from "./preferences";
import "./intro.css";

// Pages without the loader keep the defaults: already revealed, nothing to wait for.
export const IntroContext = createContext({ revealed: true, settle: () => {} });

const MAX_WAIT = 12000;
const WORD = "Welcome";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$";
// Fixed so the server render and hydration agree; it starts shuffling once mounted.
const START = "X#8@QK$";

function ScrambledWelcome({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState(START);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let hold = 0;
    const timer = window.setInterval(() => {
      // Timed, not counted, so a busy main thread cannot stretch it: 0.25s of noise, then a letter every 0.25s.
      const settled = reduced ? WORD.length : Math.max(0, Math.floor((performance.now() - start - 250) / 250));
      setText([...WORD].map((char, index) => index < settled ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(""));
      if (settled < WORD.length) return;
      window.clearInterval(timer);
      hold = window.setTimeout(onDone, 350);
    }, 80);
    return () => { window.clearInterval(timer); window.clearTimeout(hold); };
  }, [onDone]);
  return <>
    <span className="site-loader-measure">{WORD}.</span>
    <span className="site-loader-scramble">{text}<span className="accent-period">.</span></span>
  </>;
}

export default function Intro({ children }: { children: ReactNode }) {
  const { t } = useCopy();
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [settled, setSettled] = useState(false);
  const [spelled, setSpelled] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const settle = useCallback(() => setSettled(true), []);
  const spell = useCallback(() => setSpelled(true), []);
  const entered = loaded && settled && spelled;

  useEffect(() => {
    let alive = true;
    const pageLoad = new Promise((resolve) => {
      if (document.readyState === "complete") resolve(null);
      else addEventListener("load", resolve, { once: true });
    });
    Promise.all([document.fonts.ready, pageLoad]).then(() => alive && setLoaded(true));
    // Never trap visitors behind the loader if a scene stalls.
    const fallback = setTimeout(() => { setLoaded(true); setSettled(true); setSpelled(true); }, MAX_WAIT);
    return () => { alive = false; clearTimeout(fallback); };
  }, []);

  return (
    <IntroContext.Provider value={{ revealed, settle }}>
      {/* Without JavaScript the loader would never lift, so skip it entirely. */}
      <noscript dangerouslySetInnerHTML={{ __html: "<style>.site-loader{display:none!important}html{overflow:visible!important}.portfolio-home :is(.nav-wrap,.about-copy,.lanyard-area){opacity:1!important}</style>" }} />
      <div className="portfolio-home" data-entered={entered} data-revealed={revealed}>{children}</div>
      {/* Sync so the lanyard's fall starts before the first frame that shows it. */}
      <AnimatePresence onExitComplete={() => flushSync(() => setRevealed(true))}>
        {!entered && (
          <motion.div
            key="site-loader"
            className="site-loader"
            exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={reduced ? { duration: 0.2 } : { duration: 0.85, delay: 0.35, ease: [0.76, 0, 0.24, 1] }}
          >
            <span className="sr-only" role="status">{t("Memuat portfolio", "Loading portfolio")}</span>
            <motion.p
              className="site-loader-title"
              aria-hidden="true"
              exit={reduced ? undefined : { y: -32, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            >
              <ScrambledWelcome onDone={spell} />
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </IntroContext.Provider>
  );
}
