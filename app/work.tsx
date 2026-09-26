"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  IconArrowUpRight,
  IconArrowRight,
  IconPlus,
  IconX,
  IconPhoto,
  IconFolder,
  IconBrandGithub,
  IconBrandTypescript,
  IconBrandPython,
  IconBrandFlutter,
  IconBrandHtml5,
  IconBrandCss3,
  IconBrandKotlin,
  IconBrandGit,
  IconBrandNextjs,
  IconBrandNodejs,
  IconBrandAndroid,
} from "@tabler/icons-react";
import { useCopy } from "./preferences";
import { projects, skills, type Project } from "./data";
import { Reveal } from "./sections";

const keyIcons = {
  typescript: IconBrandTypescript,
  python: IconBrandPython,
  flutter: IconBrandFlutter,
  html5: IconBrandHtml5,
  css3: IconBrandCss3,
  kotlin: IconBrandKotlin,
  git: IconBrandGit,
  nextjs: IconBrandNextjs,
  nodejs: IconBrandNodejs,
  androidstudio: IconBrandAndroid,
};
function KeyIcon({ icon }: { icon: string }) {
  const Icon = keyIcons[icon as keyof typeof keyIcons];
  return Icon ? (
    <Icon size={35} stroke={1.8} />
  ) : icon === "c" ? (
    <b className="key-symbol">C</b>
  ) : (
    <Image
      src={`/icons/${icon}.svg`}
      alt=""
      width={35}
      height={35}
      className={icon === "dart" ? "original-logo" : ""}
    />
  );
}

export function TechStack() {
  const { t } = useCopy();
  const [selected, setSelected] = useState(2);
  const skill = skills[selected];
  const related = projects.filter((p) => p.stack.includes(skill.name));
  return (
    <section id="tech-stack" className="tech section container">
      <Reveal>
        <span className="eyebrow">TECH STACK</span>
        <h2>Tech Stack.</h2>
        <p className="section-intro">
          {t(
            "Pilih satu tombol untuk melihat lebih dekat.",
            "Pick a key to take a closer look.",
          )}
        </p>
      </Reveal>
      <div className="tech-layout">
        <div
          className="keyboard"
          role="group"
          aria-label={t("Pilih teknologi", "Choose a technology")}
        >
          <div className="keys">
            {skills.map((item, i) => (
              <button
                key={item.name}
                className={`key ${i === selected ? "selected" : ""}`}
                style={{ "--key-color": item.color } as CSSProperties}
                onClick={() => setSelected(i)}
                aria-label={item.name}
                aria-pressed={i === selected}
                aria-controls="skill-detail"
              >
                <span className="key-shoulder" aria-hidden="true" />
                <span className="key-face">
                  <KeyIcon icon={item.icon} />
                </span>
                <span className="key-label">{item.name}</span>
              </button>
            ))}
            <div className="key decorative-key" aria-hidden="true">
              <span className="key-face">
                <IconArrowRight size={32} />
                <span>Keep exploring</span>
              </span>
            </div>
          </div>
          <div className="keyboard-bottom">
            <span>{t("Pilih teknologi", "Choose a technology")}</span>
            <span>14 KEYS</span>
          </div>
        </div>
        <div
          className="skill-detail"
          id="skill-detail"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="skill-heading">
            <span className="skill-category">{skill.category}</span>
            <Image
              src={`/icons/${skill.icon}.svg`}
              alt=""
              width={60}
              height={60}
            />
          </div>
          <h3>
            {skill.name}
            <span className="accent-period">.</span>
          </h3>
          <span className="eyebrow">
            {t("AREA PEMAHAMAN", "AREAS OF UNDERSTANDING")}
          </span>
          <p className="skill-description">{t(skill.focus, skill.focusEn)}</p>
          <div className="related-projects">
            <span className="eyebrow">{t("DIGUNAKAN DI", "USED IN")}</span>
            {related.length ? (
              related.map((p) => (
                <a href={`#project-${p.id}`} key={p.id}>
                  <span>
                    <IconFolder size={19} />
                    {t(p.title, p.titleEn)}
                  </span>
                  <IconArrowUpRight size={19} />
                </a>
              ))
            ) : (
              <p>
                {t(
                  "Detail proyek yang menggunakan teknologi ini belum ditambahkan.",
                  "Project details for this technology have not been added yet.",
                )}
              </p>
            )}
          </div>
          <p className="skill-footnote">
            {t(
              "Pengalaman melalui pembelajaran dan proyek kampus.",
              "Experience through learning and university projects.",
            )}
          </p>
        </div>
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
