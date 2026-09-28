"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";

// React Bits CountUp adapted for whole-number contribution statistics.
export default function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false });
  const reduced = useReducedMotion();
  const value = useMotionValue(0);
  const spring = useSpring(value, { stiffness: 80, damping: 24 });
  useEffect(() => {
    if (inView) value.set(to);
    else {
      value.set(0);
      spring.jump(0);
    }
  }, [inView, to, value, spring]);
  useEffect(() => {
    const format = (n: number) => `${new Intl.NumberFormat("en-US").format(Math.round(n))}${suffix}`;
    if (reduced) {
      if (ref.current) ref.current.textContent = format(to);
      return;
    }
    return spring.on("change", (n) => {
      if (ref.current) ref.current.textContent = format(n);
    });
  }, [reduced, spring, suffix, to]);
  return <span ref={ref} aria-label={`${to}${suffix}`}>{reduced ? `${to}${suffix}` : `0${suffix}`}</span>;
}
