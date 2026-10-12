"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { flushSync } from "react-dom";
import type { LanyardProps } from "./lanyard-card";
import { useCopy } from "./preferences";
import { frontPreview, backPreview } from "./lanyard-previews";

const LanyardCard = dynamic(() => import("./lanyard-card"), { ssr: false });

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function Lanyard({
  frontImage = "/lanyard/front.webp", backImage = "/lanyard/back.webp",
  strapImage = "/lanyard/strap.webp", ...props
}: LanyardProps) {
  const { t } = useCopy();
  const host = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    change();
    query.addEventListener("change", change);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLoaded(true);
    });
    if (host.current) observer.observe(host.current);
    return () => { observer.disconnect(); query.removeEventListener("change", change); };
  }, []);

  const preview = flipped ? backPreview : frontPreview;
  const fallback = <div className="lanyard-static"><div className="static-strap" /><Image src={previewOnly ? preview : flipped ? backImage : frontImage} placeholder={preview} onError={() => setPreviewOnly(true)} width={256} height={384} unoptimized preload={!flipped} alt={flipped ? t("Stiker teknologi", "Technology stickers") : "Asarya Jachred Alotia"} /></div>;

  return <div className="lanyard-scene" ref={host} data-ready={ready}>
    <div className="lanyard-stage" role="button" tabIndex={0} aria-pressed={flipped}
      aria-label={t("Lanyard interaktif. Tarik kartu. Klik atau tekan Enter untuk membalik.", "Interactive lanyard. Drag the card. Click or press Enter to flip.")}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setFlipped(value => !value); }
      }}
      onClick={() => { if (reduced || failed) setFlipped(value => !value); }}>
      {(!ready || reduced || failed || !loaded) && fallback}
      {!reduced && !failed && loaded && <SceneBoundary fallback={null} onFailure={() => setFailed(true)}>
        <LanyardCard frontImage={frontImage} backImage={backImage} strapImage={strapImage}
          size={0.52} strapLength={0.32} strapWidth={0.65} strapColor="#171c22" damping={0.7} breeze={0.16} finish="matte" cardColor="#111111" intro={true}
          {...props} flipped={flipped} onFlip={setFlipped} onReady={() => flushSync(() => setReady(true))} onFailure={() => setFailed(true)} />
      </SceneBoundary>}
      {!ready && !failed && !reduced && loaded && <span className="scene-loading" role="status">{t("Memuat lanyard...", "Loading lanyard...")}</span>}
    </div>
  </div>;
}
