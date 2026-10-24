"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { IconArrowLeft, IconArrowRight, IconArrowUpRight, IconBrandGithub, IconBrandGooglePlay, IconPhoto, IconPlayerPlay, IconX } from "@tabler/icons-react";
import { useCopy } from "../../preferences";
import { Header } from "../../sections";
import type { Media, ProjectRecord } from "../../../lib/models";
import StackTags from "../../project-stack";

function ZoomImage({ src, alt, loading }: { src: string; alt: string; loading?: "eager" | "lazy" }) {
  const { t } = useCopy();
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" className="zoom-image" onClick={() => dialog.current?.showModal()} aria-label={`${t("Lihat layar penuh", "View full screen")}: ${alt}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={loading} />
    </button>
    {/* React bubbles cancel/keydown up its tree: keep Esc and arrows away from the project dialog and gallery. */}
    <dialog ref={dialog} className="image-lightbox" aria-label={alt} onClick={() => dialog.current?.close()}
      onCancel={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lightbox-image" src={src} alt={alt} />
      <button type="button" autoFocus className="icon-button lightbox-close" aria-label={t("Tutup", "Close")}><IconX size={22} /></button>
    </dialog>
  </>;
}

export function ProjectGallery({ project }: { project: ProjectRecord }) {
  const { lang, t } = useCopy();
  const [active, setActive] = useState(0);
  const images = project.coverImages;
  const select = (step: number) => setActive((current) => (current + step + images.length) % images.length);
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      select(event.key === "ArrowRight" ? 1 : -1);
    }
  };
  const alt = (media: Media) => (lang === "id" ? media.altId : media.altEn) || project.translations[lang].title;

  if (!images.length) return (
    <div className="project-detail-empty"><IconPhoto size={55} stroke={1} /><span>{t("Gambar akan ditambahkan", "Images coming soon")}</span></div>
  );

  return (
    <div className="stack-gallery" role="group" aria-label={t("Galeri foto proyek", "Project photo gallery")} onKeyDown={keyboard} tabIndex={images.length > 1 ? 0 : undefined}>
      <div className="stack-gallery-stage">
        {Array.from({ length: Math.min(3, images.length) }, (_, layer) => {
          const media = images[(active + layer) % images.length];
          return (
            <div key={layer} className={`stacked-photo layer-${layer}`} aria-hidden={layer > 0}>
              {layer === 0 ? <ZoomImage src={media.url} alt={alt(media)} loading="eager" /> : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt="" loading="lazy" />
              )}
            </div>
          );
        })}
      </div>
      {images.length > 1 && (
        <div className="stack-gallery-controls">
          <button type="button" onClick={() => select(-1)} aria-label={t("Foto sebelumnya", "Previous photo")}><IconArrowLeft size={20} /></button>
          <span aria-live="polite">{active + 1} / {images.length}</span>
          <button type="button" onClick={() => select(1)} aria-label={t("Foto berikutnya", "Next photo")}><IconArrowRight size={20} /></button>
        </div>
      )}
    </div>
  );
}

export function ProjectBlocks({ project }: { project: ProjectRecord }) {
  const { lang, t } = useCopy();
  const copy = project.translations[lang];
  return <article className="project-detail-content">
    {copy.blocks.length ? copy.blocks.map((block) => {
      if (block.type === "heading") return <h2 key={block.id}>{block.text}</h2>;
      if (block.type === "paragraph") return <p key={block.id}>{block.text}</p>;
      if (block.type === "image" && block.image) return <figure key={block.id}>
        <ZoomImage src={block.image.url} alt={(lang === "id" ? block.image.altId : block.image.altEn) || copy.title} loading="lazy" />
      </figure>;
      return null;
    }) : <p>{copy.summary}</p>}
    {project.placeholder && <p className="placeholder-note">{t("Konten sementara. Informasi proyek asli akan ditambahkan.", "Placeholder content. Real project information will be added.")}</p>}
  </article>;
}

export function ProjectActions({ project }: { project: ProjectRecord }) {
  const links = project.links;
  if (!links.repository && !links.demo && !links.video && !links.playStore) return null;
  return <div className="project-actions">
    {links.repository && <a className="pill glass" href={links.repository} target="_blank" rel="noreferrer"><IconBrandGithub size={18} /> Repository</a>}
    {links.demo && <a className="pill primary" href={links.demo} target="_blank" rel="noreferrer">Live demo <IconArrowUpRight size={18} /></a>}
    {links.video && <a className="pill glass" href={links.video} target="_blank" rel="noreferrer"><IconPlayerPlay size={18} /> Video</a>}
    {links.playStore && <a className="pill glass" href={links.playStore} target="_blank" rel="noreferrer"><IconBrandGooglePlay size={18} /> Google Play</a>}
  </div>;
}

export function ProjectStack({ project }: { project: ProjectRecord }) {
  const { t } = useCopy();
  if (!project.stack.length) return null;
  return <section className="project-stack" aria-label={t("Teknologi proyek", "Project technology")}>
    <h2 className="eyebrow">{t("DIBANGUN DENGAN", "BUILT WITH")}</h2>
    <StackTags tags={project.stack} />
  </section>;
}

export function ProjectDetail({ project }: { project: ProjectRecord }) {
  const { lang, t } = useCopy();
  const copy = project.translations[lang];
  return (
    <>
      <a className="skip-link" href="#project-content">{t("Lewati ke konten", "Skip to content")}</a>
      <Header homeLinks />
      <main id="project-content" className="project-detail-page container">
        <div className="project-detail-intro">
          <Link href="/#projects" className="detail-back"><IconArrowLeft size={18} /> {t("Kembali ke proyek", "Back to projects")}</Link>
          <span className="eyebrow">{copy.category}</span>
          <h1>{copy.title}</h1>
          <p>{copy.summary}</p>
        </div>
        <ProjectGallery project={project} />
        <ProjectBlocks project={project} />
        <ProjectStack project={project} />
        <ProjectActions project={project} />
      </main>
    </>
  );
}
