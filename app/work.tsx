"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  IconArrowUpRight,
  IconArrowRight,
  IconPlus,
  IconX,
  IconPhoto,
  IconBrandGithub,
} from "@tabler/icons-react";
import { useCopy } from "./preferences";
import { projects, skills, type Project } from "./data";
import { Reveal } from "./sections";

export function Skills() {
  const { t } = useCopy();
  const categories = ["Frontend", "Backend", "Mobile", "Programming", "Tools"];
  return (
    <section
      id="skill"
      className="skills section container"
      aria-labelledby="skill-title"
    >
      <Reveal>
        <span className="eyebrow">{t("KEMAMPUAN", "CAPABILITIES")}</span>
        <h2 id="skill-title">Skill.</h2>
        <p className="section-intro">
          {t(
            "Teknologi yang saya gunakan dalam pembelajaran dan proyek kampus.",
            "Technologies I use through learning and university projects.",
          )}
        </p>
      </Reveal>
      <div className="skill-groups">
        {categories.map((category, index) => (
          <Reveal className="skill-group" key={category}>
            <div className="skill-group-heading">
              <h3>{category}</h3>
              <span aria-hidden="true">0{index + 1}</span>
            </div>
            <ul>
              {skills
                .filter((skill) => skill.category === category)
                .map((skill) => (
                  <li key={skill.name}>
                    <Image
                      src={`/icons/${skill.icon}.svg`}
                      width={24}
                      height={24}
                      alt=""
                    />
                    <span>{skill.name}</span>
                  </li>
                ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
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
  const [view, setView] = useState<Project | "all" | null>(null);
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
          <h2>{t("Proyek pilihan.", "Selected projects.")}</h2>
        </div>
        <p>
          {t(
            "Eksplorasi ide menjadi website dan aplikasi.",
            "Exploring ideas through websites and applications.",
          )}
        </p>
      </Reveal>
      <div className="project-list">
        {projects.slice(0, 3).map((project, i) => (
          <Reveal
            className={`project-row ${i % 2 ? "reverse" : ""}`}
            key={project.id}
          >
            <article id={`project-${project.id}`}>
              <button
                className="project-image-button"
                onClick={() => setView(project)}
                aria-label={`${t("Lihat detail", "View details")}: ${t(project.title, project.titleEn)}`}
              >
                <ProjectImage project={project} />
              </button>
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
                  More detail
                  <IconArrowUpRight size={20} />
                </button>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <div className="more-projects">
        <button className="pill glass" onClick={() => setView("all")}>
          More projects
          <IconPlus size={19} />
        </button>
        <span>
          {t(
            "Lihat seluruh koleksi proyek",
            "Explore the full project collection",
          )}
        </span>
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
        <div className="dialog-inner">
          <button
            autoFocus
            className="icon-button dialog-close"
            onClick={() => setView(null)}
            aria-label={t("Tutup detail", "Close details")}
          >
            <IconX size={23} />
          </button>
          {view === "all" ? (
            <>
              <span className="eyebrow">PROJECT COLLECTION</span>
              <h2 id="dialog-title">{t("Semua proyek.", "All projects.")}</h2>
              <div className="project-gallery">
                {projects.map((p) => (
                  <button key={p.id} onClick={() => setView(p)}>
                    <ProjectImage project={p} />
                    <span>
                      {t(p.title, p.titleEn)}
                      <IconArrowUpRight size={19} />
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : view ? (
            <>
              <span className="eyebrow">
                {t(view.category, view.categoryEn)}
              </span>
              <h2 id="dialog-title">{t(view.title, view.titleEn)}</h2>
              <ProjectImage project={view} large />
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
                  <button className="text-link" onClick={() => setView("all")}>
                    {t("Semua proyek", "All projects")}
                    <IconArrowRight size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </dialog>
    </section>
  );
}
