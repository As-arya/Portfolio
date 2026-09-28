"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollReveal({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const trigger = el.closest(".about") ?? el;
    const words = el.querySelectorAll(".scroll-reveal-word");
    const context = gsap.context(() => {
      gsap.fromTo(words, { opacity: 0.15 }, {
        opacity: 1,
        stagger: 0.05,
        ease: "none",
        scrollTrigger: { trigger, start: "center 70%", end: "center center", scrub: true },
      });
    }, el);
    return () => context.revert();
  }, [text]);

  return (
    <p ref={ref} className="body-copy scroll-reveal">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((part, index) =>
          /^\s+$/.test(part) ? part : <span className="scroll-reveal-word" key={index}>{part}</span>,
        )}
      </span>
    </p>
  );
}
