"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconArrowUpRight, IconChevronDown, IconPhoto, IconPlus, IconX } from "@tabler/icons-react";
import { useCopy } from "./preferences";
import { profile } from "./data";
import { Reveal } from "./sections";
import PixelCard from "./pixel-card";
import { ProjectActions, ProjectBlocks, ProjectGallery, ProjectStack } from "./projects/[slug]/project-detail";
import StackTags from "./project-stack";
import type { ProjectRecord } from "../lib/models";

const PixelBlast = dynamic(() => import("./pixel-blast"), { ssr: false });

function ProjectImage({ project }: { project: ProjectRecord }) {
  const { lang, t } = useCopy();
  const cover = project.coverImages[0];
  return (
    <div className={`project-image ${project.slug === "next-project" ? "next-project" : ""}`}>
      {cover ? (
        // Cloudinary images have dynamic hostnames configured by the site owner.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt={(lang === "id" ? cover.altId : cover.altEn) || project.translations[lang].title} loading="lazy" />
      ) : (
        <div className="project-placeholder">
          {project.slug === "next-project" ? <IconPlus size={55} stroke={1} /> : <IconPhoto size={49} stroke={1} />}
          <span>{project.slug === "next-project" ? t("Proyek berikutnya", "Next project") : t("Preview proyek", "Project preview")}</span>
          <small>{t("Gambar akan ditambahkan", "Image coming soon")}</small>
        </div>
      )}
    </div>
  );
}

export function Projects({ projects }: { projects: ProjectRecord[] }) {
  const { lang, t } = useCopy();
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<ProjectRecord | null>(null);
  const [closing, setClosing] = useState(false);
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!view || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus();
    };
  }, [view]);
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function openProject(project: ProjectRecord, trigger: HTMLElement) {
    opener.current = trigger;
    setView(project);
  }
  function closeProject() {
    if (!view || closing) return;
    if (reduced) { setView(null); return; }
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setView(null);
      setClosing(false);
    }, 240);
  }
  return (
    <section id="projects" className="projects section container">
      <Reveal className="projects-heading">
        <div>
          <h2>Selected projects.</h2>
        </div>
      </Reveal>
      <div className="project-list" id="additional-projects">
        <AnimatePresence initial={false}>
          {projects.slice(0, expanded ? undefined : 3).map((project, i) => {
            const copy = project.translations[lang];
            return (
              <motion.div
                className={`project-row ${i % 2 ? "reverse" : ""} ${!expanded && i === Math.min(projects.length, 3) - 1 ? "project-row-faded" : ""}`}
                key={project.slug}
                initial={reduced ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.12 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: reduced ? 0 : 0.4 }}
              >
                <article id={`project-${project.slug}`}>
                  <PixelCard>
                    <button className="project-image-button" onClick={(event) => openProject(project, event.currentTarget)} aria-label={`${t("Lihat detail", "View details")}: ${copy.title}`}>
                      <ProjectImage project={project} />
                    </button>
                  </PixelCard>
                  <div className="project-copy">
                    <span className="eyebrow">{copy.category}</span>
                    <h3>{copy.title}</h3>
                    <p>{copy.summary}</p>
                    <StackTags tags={project.stack} />
                    <button className="detail-link" onClick={(event) => openProject(project, event.currentTarget)}>
                      {t("Lihat detail", "More detail")}
                      <IconArrowUpRight size={20} />
                    </button>
                  </div>
                </article>
              </motion.div>
            );
          })}
          {expanded && projects.length <= 3 && (
            <motion.div
              key="empty-projects"
              className="projects-empty"
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: reduced ? 0 : 0.4 }}
            >
              <span className="eyebrow">NEXT UP</span>
              <p>{t("Proyek lainnya sedang disiapkan.", "More projects are on the way.")}</p>
              <span>{t("Sementara itu, lihat aktivitas saya di GitHub.", "In the meantime, explore my work on GitHub.")}</span>
              <a href={profile.github} target="_blank" rel="noreferrer">GitHub <IconArrowUpRight size={17} /></a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="more-projects">
        <button className="more-projects-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="additional-projects">
          <IconChevronDown size={22} stroke={1.5} />
          <span>{expanded ? t("Tampilkan lebih sedikit", "Show less") : t("Lihat lainnya", "See more")}</span>
        </button>
      </div>
      <dialog
        ref={dialog}
        className={`project-dialog${closing ? " is-closing" : ""}`}
        aria-labelledby="dialog-title"
        onCancel={(event) => { event.preventDefault(); closeProject(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeProject(); }}
      >
        <div className="dialog-pixel" aria-hidden="true">{view && <PixelBlast />}</div>
        <button autoFocus className="icon-button dialog-close" onClick={closeProject} aria-label={t("Tutup detail", "Close details")}><IconX size={22} /></button>
        {view && <div className="dialog-inner">
          <header className="dialog-heading">
            <div>
              <span className="eyebrow">{view.translations[lang].category}</span>
              <h2 id="dialog-title">{view.translations[lang].title}</h2>
              <p>{view.translations[lang].summary}</p>
            </div>
          </header>
          <div className="dialog-gallery"><ProjectGallery key={view.slug} project={view} /></div>
          <div className="dialog-content-grid no-meta">
            <div className="dialog-story">
              <ProjectBlocks project={view} />
              <ProjectStack project={view} />
              <ProjectActions project={view} />
            </div>
          </div>
        </div>}
      </dialog>
    </section>
  );
}
