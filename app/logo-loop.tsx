"use client";

type Logo = { name: string; src: string; url: string };

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
            {logos.map(({ name, src, url }) => (
              <li key={name}>
                <a className="technology-logo" href={url} target="_blank" rel="noopener noreferrer" tabIndex={copy > 0 ? -1 : 0}>
                  <span className="technology-logo-icon" aria-hidden="true">
                    <img src={src} alt="" width={32} height={32} draggable={false} />
                  </span>
                  <span>{name}</span>
                </a>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
