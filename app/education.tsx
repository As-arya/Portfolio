"use client";

import type { EducationRecord } from "../lib/models";
import { useCopy } from "./preferences";
import { Reveal } from "./sections";
import EducationLogo from "./education-logo";
import "./education.css";

export default function Education({ entries }: { entries: EducationRecord[] }) {
  const { lang, t } = useCopy();
  return <section id="education" className="education section container" aria-labelledby="education-title">
    <Reveal className="education-heading">
      <div><span className="eyebrow">{t("PERJALANAN BELAJAR", "LEARNING JOURNEY")}</span><h2 id="education-title">Education<span className="accent-period">.</span></h2></div>
    </Reveal>
    {entries.length ? <div className="education-list">{entries.map(entry => {
      const content = entry.translations[lang];
      return <Reveal key={entry.id} className="education-row"><article>
        <div className="education-meta"><div className="education-years"><time dateTime={String(entry.startYear)}>{entry.startYear}</time><span aria-hidden="true"> — </span>{entry.endYear === null ? <span className="education-now">{t("Sekarang", "Present")}</span> : <time dateTime={String(entry.endYear)}>{entry.endYear}</time>}</div>
        </div>
        <EducationLogo entry={entry} lang={lang} />
        <div className="education-copy"><h3>{entry.institution}</h3><p className="education-program">{content.program}</p>
          {content.description && <p className="education-description">{content.description}</p>}
          {content.courses.length > 0 && <div className="education-coursework"><h4 className="eyebrow">{content.courseworkTitle || t("MATA PELAJARAN / MATA KULIAH", "SELECTED COURSEWORK")}</h4><ul>{content.courses.map((course, index) => <li key={index}><strong>{course.title}</strong>{course.description && <p>{course.description}</p>}</li>)}</ul></div>}
        </div>
      </article></Reveal>;
    })}</div> : <p className="education-empty">{t("Riwayat pendidikan akan ditambahkan.", "Education history will be added soon.")}</p>}
  </section>;
}
