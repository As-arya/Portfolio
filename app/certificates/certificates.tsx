"use client";

import { useEffect, useRef, useState } from "react";
import { IconArrowUpRight, IconX } from "@tabler/icons-react";
import type { CertificateRecord } from "../../lib/models";
import { Reveal } from "../sections";
import { useCopy } from "../preferences";
import "./certificates.css";

export default function Certificates({ entries }: { entries: CertificateRecord[] }) {
  const { lang, t } = useCopy();
  const [selected, setSelected] = useState<CertificateRecord | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selected || !dialog.current) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; opener.current?.focus(); };
  }, [selected]);

  const alt = (entry: CertificateRecord) => (lang === "id" ? entry.image.altId : entry.image.altEn) || entry.translations[lang].title;
  return <section id="certificates" className="certificates section container" aria-labelledby="certificates-title">
      <div className="certificates-intro">
        <div>
        <h2 id="certificates-title">Certificates<span className="accent-period">.</span></h2></div>
      </div>
      <div className="certificates-grid">{entries.map(entry => <Reveal key={entry.id} className="certificate-card"><article>
        <button className="certificate-image-button" onClick={event => { opener.current = event.currentTarget; setSelected(entry); }} aria-label={`${t("Lihat sertifikat", "View certificate")}: ${entry.translations[lang].title}`}>
          <img src={entry.image.url} alt={alt(entry)} loading="lazy" />
          <span className="certificate-view">{t("Perbesar", "Enlarge")}<IconArrowUpRight size={17} /></span>
        </button>
        <div className="certificate-copy"><span className="eyebrow">{entry.image.publicId.startsWith("sample/") ? t("DATA CONTOH", "SAMPLE CONTENT") : t("SERTIFIKAT", "CERTIFICATE")}</span><h2>{entry.translations[lang].title}</h2><p>{entry.translations[lang].description}</p></div>
      </article></Reveal>)}</div>
      {!entries.length && <p className="certificates-empty">{t("Sertifikat akan ditambahkan.", "Certificates will be added soon.")}</p>}
    <dialog ref={dialog} className="certificate-dialog" aria-labelledby="certificate-dialog-title" onCancel={event => { event.preventDefault(); setSelected(null); }} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <button autoFocus className="icon-button certificate-dialog-close" onClick={() => setSelected(null)} aria-label={t("Tutup sertifikat", "Close certificate")}><IconX size={22} /></button>
      {selected && <><h2 id="certificate-dialog-title">{selected.translations[lang].title}</h2><img src={selected.image.url} alt={alt(selected)} /><p>{selected.translations[lang].description}</p></>}
    </dialog>
  </section>;
}
