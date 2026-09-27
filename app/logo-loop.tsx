"use client";

import type { ReactNode } from "react";

type Logo = { name: string; src?: string; icon?: ReactNode };

// Horizontal React Bits LogoLoop adapted to the three fixed portfolio rows.
export default function LogoLoop({
  logos,
  reverse = false,
  label,
}: {
  logos: Logo[];
  reverse?: boolean;
  label: string;
}) {
  return (
    <div className={`logo-loop${reverse ? " logo-loop--reverse" : ""}`} role="region" aria-label={label}>
      <div className="logo-loop-track">
        {Array.from({ length: 4 }, (_, copy) => (
          <ul className="logo-loop-list" key={copy} aria-hidden={copy > 0}>
            {logos.map(({ name, src, icon }) => (
              <li className="technology-logo" key={name}>
                <span className="technology-logo-icon" aria-hidden="true">
                  {src ? <img src={src} alt="" width={32} height={32} draggable={false} /> : icon}
                </span>
                <span>{name}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
