"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./glass-surface.css";

type GlassSurfaceProps = {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B";
  yChannel?: "R" | "G" | "B";
  mixBlendMode?: CSSProperties["mixBlendMode"];
  className?: string;
  style?: CSSProperties;
};

export default function GlassSurface({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  className = "",
  style,
}: GlassSurfaceProps) {
  const id = useId().replace(/:/g, "-");
  const filterId = `glass-filter-${id}`;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [supported, setSupported] = useState(false);
  const [reducedTransparency, setReducedTransparency] = useState(false);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-transparency: reduce), (prefers-contrast: more)");
    const updatePreference = () => setReducedTransparency(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    const browser = navigator.userAgent;
    setSupported(
      !/Firefox/.test(browser) &&
        !(/Safari/.test(browser) && !/Chrome|Chromium|Edg/.test(browser)) &&
        CSS.supports("backdrop-filter", `url(#${filterId})`),
    );
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", updatePreference);
    };
  }, [filterId]);

  const edge = Math.min(size.width, size.height) * borderWidth * 0.5;
  const map = `<svg viewBox="0 0 ${size.width} ${size.height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="100%" height="100%" fill="black"/><rect width="100%" height="100%" rx="${borderRadius}" fill="url(#red)"/><rect width="100%" height="100%" rx="${borderRadius}" fill="url(#blue)" style="mix-blend-mode:${mixBlendMode}"/><rect x="${edge}" y="${edge}" width="${Math.max(0, size.width - edge * 2)}" height="${Math.max(0, size.height - edge * 2)}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/></svg>`;
  const surfaceStyle = {
    ...style,
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius,
    "--glass-frost": backgroundOpacity,
    "--glass-saturation": saturation,
    "--glass-filter": `url(#${filterId})`,
    backdropFilter: reducedTransparency
      ? "none"
      : supported && size.width && size.height
        ? `url(#${filterId}) saturate(${saturation})`
        : "blur(4px) saturate(1.3)",
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`glass-surface glass-surface--${supported && size.width && size.height ? "svg" : "fallback"} ${className}`}
      style={surfaceStyle}
      aria-hidden={children ? undefined : true}
    >
      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage href={`data:image/svg+xml,${encodeURIComponent(map)}`} width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + redOffset} xChannelSelector={xChannel} yChannelSelector={yChannel} result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + greenOffset} xChannelSelector={xChannel} yChannelSelector={yChannel} result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + blueOffset} xChannelSelector={xChannel} yChannelSelector={yChannel} result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur in="output" stdDeviation={displace} />
          </filter>
        </defs>
      </svg>
      {children && <div className="glass-surface__content">{children}</div>}
    </div>
  );
}
