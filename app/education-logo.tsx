import type { EducationRecord } from "../lib/models";
import "./education-logo.css";

export default function EducationLogo({ entry, lang = "id" }: { entry: EducationRecord; lang?: "id" | "en" }) {
  if (!entry.logo) return null;
  const { scale = 100, x = 50, y = 50 } = entry.logoDisplay ?? {};
  return <span className="education-logo">
    <img src={entry.logo.url} alt={(lang === "id" ? entry.logo.altId : entry.logo.altEn) || entry.institution} loading="lazy" style={{
      width: `${scale}%`, height: `${scale}%`, left: `${x}%`, top: `${y}%`, transform: `translate(-${x}%, -${y}%)`, objectPosition: `${x}% ${y}%`,
    }} />
  </span>;
}
