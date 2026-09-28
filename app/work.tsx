"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconArrowUpRight,
  IconPlus,
  IconX,
  IconPhoto,
  IconBrandGithub,
  IconChevronDown,
  IconBrandGooglePlay,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useCopy } from "./preferences";
import { profile, projects, type Project } from "./data";
import { Reveal } from "./sections";
import PixelCard from "./pixel-card";

const PixelBlast = dynamic(() => import("./pixel-blast"), { ssr: false });

function ProjectImage({
  project,
  large = false,
}: {
  project: Project;
  large?: boolean;
}) {
  const { t } = useCopy();
  return (
    <div
      className={`project-image ${project.id === "next-project" ? "next-project" : ""} ${large ? "large" : ""}`}
    >
      {project.image ? (
        <Image
          src={project.image}
          alt={t(project.title, project.titleEn)}
          fill
          sizes="(max-width: 768px) 100vw, 600px"
        />
      ) : (
        <div className="project-placeholder">
          {project.id === "next-project" ? (
            <IconPlus size={55} stroke={1} />
          ) : (
            <IconPhoto size={49} stroke={1} />
          )}
          <span>
            {project.id === "next-project"
              ? t("Proyek berikutnya", "Next project")
              : t("Preview proyek", "Project preview")}
          </span>
          <small>{t("Gambar akan ditambahkan", "Image coming soon")}</small>
        </div>
      )}
    </div>
  );
}
export function Projects() {
  const { t } = useCopy();
  const [view, setView] = useState<Project | null>(null);
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!view) return;
    const d = dialog.current!;
    d.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d.close();
      document.body.style.overflow = previous;
    };
  }, [view]);
  return (
    <section id="projects" className="projects section container">
      <Reveal className="projects-heading">
        <div>
          <span className="eyebrow">SELECTED WORK</span>
          <h2>Selected projects.</h2>
        </div>
        <p>
          {t(
            "Eksplorasi ide menjadi website dan aplikasi.",
            "Exploring ideas through websites and applications.",
          )}
        </p>
      </Reveal>
      <div className="project-list" id="additional-projects">
        <AnimatePresence initial={false}>
        {projects.slice(0, expanded ? undefined : 3).map((project, i) => (
          <motion.div
            className={`project-row ${i % 2 ? "reverse" : ""} ${!expanded && i === Math.min(projects.length, 3) - 1 ? "project-row-faded" : ""}`}
            key={project.id}
            initial={reduced ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.12 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: reduced ? 0 : 0.4 }}
          >
            <article id={`project-${project.id}`}>
              <PixelCard>
                <button
                  className="project-image-button"
                  onClick={() => setView(project)}
                  aria-label={`${t("Lihat detail", "View details")}: ${t(project.title, project.titleEn)}`}
                >
                  <ProjectImage project={project} />
                </button>
              </PixelCard>
              <div className="project-copy">
                <span className="eyebrow">
                  {t(project.category, project.categoryEn)}
                </span>
                <h3>{t(project.title, project.titleEn)}</h3>
                <p>{t(project.summary, project.summaryEn)}</p>
                <div className="project-tags">
                  {project.stack.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <button
                  className="detail-link"
                  onClick={() => setView(project)}
                >
                  {t("Lihat detail", "More detail")}
                  <IconArrowUpRight size={20} />
                </button>
              </div>
            </article>
          </motion.div>
        ))}
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
            <a href={profile.github} target="_blank" rel="noreferrer">
              GitHub <IconArrowUpRight size={17} />
            </a>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      <div className="more-projects">
        <button
          className="more-projects-toggle"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="additional-projects"
        >
          <IconChevronDown size={22} stroke={1.5} />
          <span>{expanded ? t("Tampilkan lebih sedikit", "Show less") : t("Lihat lainnya", "See more")}</span>
        </button>
      </div>
      <dialog
        ref={dialog}
        className="project-dialog"
        onCancel={() => setView(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setView(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-pixel" aria-hidden="true">{view && <PixelBlast />}</div>
        <div className="dialog-inner">
          <button
            autoFocus
            className="icon-button dialog-close"
            onClick={() => setView(null)}
            aria-label={t("Tutup detail", "Close details")}
          >
            <IconX size={23} />
          </button>
          {view && (
            <>
              <span className="eyebrow">
                {t(view.category, view.categoryEn)}
              </span>
              <h2 id="dialog-title">{t(view.title, view.titleEn)}</h2>
              <ProjectImage project={view} large />
              {!!view.images?.length && (
                <div className="project-detail-gallery">
                  {view.images.map((src, index) => (
                    <Image key={src} src={src} width={600} height={360} alt={`${t(view.title, view.titleEn)} — ${index + 1}`} />
                  ))}
                </div>
              )}
              <div className="detail-body">
                <h3>{t("Tentang proyek", "About the project")}</h3>
                <p>{t(view.description, view.descriptionEn)}</p>
                <div className="project-tags">
                  {view.stack.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                {view.placeholder && (
                  <p className="placeholder-note">
                    {t(
                      "Konten sementara. Informasi proyek asli akan ditambahkan.",
                      "Placeholder content. Real project information will be added.",
                    )}
                  </p>
                )}
                <div className="project-actions">
                  {view.repository && (
                    <a
                      className="pill glass"
                      href={view.repository}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <IconBrandGithub size={18} />
                      Repository
                    </a>
                  )}
                  {view.demo && (
                    <a
                      className="pill primary"
                      href={view.demo}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Live demo
                      <IconArrowUpRight size={18} />
                    </a>
                  )}
                  {view.video && (
                    <a className="pill glass" href={view.video} target="_blank" rel="noreferrer">
                      <IconPlayerPlay size={18} /> {t("Video", "Video")}
                    </a>
                  )}
                  {view.playStore && (
                    <a className="pill glass" href={view.playStore} target="_blank" rel="noreferrer">
                      <IconBrandGooglePlay size={18} /> Google Play
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}
