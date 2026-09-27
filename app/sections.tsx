"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  motion,
  useReducedMotion,
} from "motion/react";
import GlassSurface from "./glass-surface";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconArrowUpRight,
  IconArrowUp,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconMoon,
  IconSun,
  IconMenu2,
  IconX,
  IconMail,
} from "@tabler/icons-react";
import { useCopy } from "./preferences";
import { profile } from "./data";
import { activeSection } from "./navigation";
const Lanyard = dynamic(() => import("./lanyard"), {
  ssr: false,
  loading: () => (
    <div className="lanyard-loading" aria-label="Loading lanyard" />
  ),
});

export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
export function Header() {
  const { lang, setLang, t } = useCopy();
  const [theme, setTheme] = useState("light");
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "light");
    const system = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      try {
        if (localStorage.getItem("portfolio-theme")) return;
      } catch {}
      const v = system.matches ? "dark" : "light";
      setTheme(v);
      document.documentElement.dataset.theme = v;
    };
    system.addEventListener("change", update);
    const sections = [
      ...document.querySelectorAll<HTMLElement>("main > section"),
    ];
    let frame = 0;
    const track = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 48);
        const navBottom =
          document.querySelector(".navbar")?.getBoundingClientRect().bottom ??
          89;
        setActive(
          activeSection(
            sections.map((section) => ({
              id: section.id,
              top:
                section.getBoundingClientRect().top +
                parseFloat(getComputedStyle(section).paddingTop),
            })),
            navBottom + 48,
          ),
        );
      });
    };
    // Preserve links shared before Tech Stack was renamed.
    if (location.hash === "#tech-stack") {
      history.replaceState(null, "", "#skill");
      document.getElementById("skill")?.scrollIntoView({ behavior: "instant" });
    }
    track();
    window.addEventListener("scroll", track, { passive: true });
    window.addEventListener("resize", track);
    const observer = new ResizeObserver(track);
    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", track);
      window.removeEventListener("resize", track);
      system.removeEventListener("change", update);
    };
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("portfolio-theme", next);
    } catch {}
  }
  return (
    <header className={`nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      <motion.nav
        className="navbar"
        aria-label="Main navigation"
      >
        <GlassSurface className="glass-layer" width="100%" height="100%" borderRadius={999} backgroundOpacity={0.55} saturation={1.15} distortionScale={-28} greenOffset={2} blueOffset={4} />
        <a
          href="#home"
          className="wordmark"
          aria-label="Asarya — Home"
          onClick={() => setMenu(false)}
        >
          <span aria-hidden="true">A</span>
          <motion.span
            className="wordmark-rest"
            aria-hidden="true"
            initial={false}
            animate={{
              width: scrolled ? 0 : "auto",
              opacity: scrolled ? 0 : 1,
            }}
            transition={{
              duration: reduced ? 0 : 0.45,
              ease: [0.2, 0.7, 0.2, 1],
            }}
          >
            sarya
          </motion.span>
        </a>
        <div className={`nav-links ${menu ? "is-open" : ""}`} id="navigation">
          {[
            ["home", "Home"],
            ["about", "About"],
            ["skill", "Technology"],
            ["projects", "Projects"],
            ["contact", "Contact"],
          ].map(([id, name]) => (
            <a
              key={id}
              href={`#${id}`}
              className={active === id ? "active" : ""}
              aria-current={active === id ? "location" : undefined}
              onClick={() => setMenu(false)}
            >
              {active === id && (
                <motion.span
                  className="nav-selection"
                  layoutId="nav-selection"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 38 }
                  }
                />
              )}
              <span className="nav-label">{name}</span>
            </a>
          ))}
        </div>
        <div className="nav-controls">
          <button
            className="language-control"
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            aria-label={t(
              "Change language to English",
              "Ubah bahasa ke Indonesia",
            )}
          >
            <b>{lang.toUpperCase()}</b>
            <span>/ {lang === "id" ? "EN" : "ID"}</span>
          </button>
          <span className="nav-divider" />
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={t("Ganti tema", "Toggle theme")}
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? <IconSun size={19} /> : <IconMoon size={19} />}
          </button>
          <button
            className="icon-button menu-button"
            onClick={() => setMenu(!menu)}
            aria-label={t("Menu navigasi", "Navigation menu")}
            aria-expanded={menu}
            aria-controls="navigation"
          >
            {menu ? <IconX size={21} /> : <IconMenu2 size={21} />}
          </button>
        </div>
      </motion.nav>
    </header>
  );
}
export function Hero() {
  const { t } = useCopy();
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`hero ${paused ? "marquee-paused" : ""}`}
      id="home"
      aria-labelledby="hero-title"
    >
      <h1 id="hero-title" className="sr-only">
        Asarya Jachred Alotia, Software Engineer
      </h1>
      <div className="hero-topline container">
        <span className="eyebrow"></span>
        <span className="availability">
          <i />
          Open to work
        </span>
      </div>
      <div className="name-marquee" aria-hidden="true">
        <div className="name-track">
          <span>ASARYA JACHRED ALOTIA&nbsp; </span>
          <span>ASARYA JACHRED ALOTIA&nbsp; </span>
        </div>
      </div>
      <Image
        src="/images/hero.webp"
        alt="Asarya Jachred Alotia"
        width={1448}
        height={1086}
        priority
        className="hero-portrait"
        sizes="(max-width: 768px) 100vw, 850px"
      />
      <div className="hero-bottom container">
        <div className="hero-intro">
          <p>
            Software
            <br />
            Engineer<span className="accent-period">.</span>
          </p>
          <span>Computer Science, BINUS University</span>
          <a className="pill glass-action" href="#projects">
            <GlassSurface className="glass-layer" width="100%" height="100%" borderRadius={999} backgroundOpacity={0.38} distortionScale={-18} greenOffset={2} blueOffset={4} />
            <span>{t("Lihat proyek", "View projects")}</span>
            <IconArrowUpRight size={19} />
          </a>
        </div>
      </div>
      <button
        className="motion-control"
        onClick={() => setPaused(!paused)}
        aria-pressed={paused}
        aria-label={
          paused
            ? t("Lanjutkan animasi", "Resume animation")
            : t("Jeda animasi", "Pause animation")
        }
      >
        {paused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
      </button>
    </section>
  );
}
function SocialLinks() {
  const { t } = useCopy();
  const [notice, setNotice] = useState("");
  return (
    <>
      <div className="social-links">
        {[
          { name: "GitHub", url: profile.github, Icon: IconBrandGithub },
          {
            name: "Instagram",
            url: profile.instagram,
            Icon: IconBrandInstagram,
          },
          { name: "LinkedIn", url: profile.linkedin, Icon: IconBrandLinkedin },
        ].map(({ name, url, Icon }) =>
          url ? (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="social-link"
              aria-label={name}
            >
              <Icon size={23} />
            </a>
          ) : (
            <button
              key={name}
              className="social-link glass"
              aria-label={`${name} (${t("belum tersedia", "not yet available")})`}
              onClick={() =>
                setNotice(
                  t(
                    `Tautan ${name} belum ditambahkan.`,
                    `The ${name} link has not been added yet.`,
                  ),
                )
              }
            >
              <Icon size={23} />
            </button>
          ),
        )}
      </div>
      <p className="social-notice" role="status">
        {notice}
      </p>
    </>
  );
}
export function About() {
  const { t } = useCopy();
  return (
    <section id="about" className="about section container">
      <Reveal className="about-copy">
        <span className="eyebrow">ABOUT ME</span>
        <h2>
          Asarya
          <br />
          Jachred Alotia<span className="accent-period">.</span>
        </h2>
        <p className="role-line">
          Computer Science Student<span>Software Engineering</span>
        </p>
        <p className="body-copy">
          {t(
            "Saya mahasiswa Computer Science di BINUS University dengan peminatan Software Engineering. Melalui proyek kampus, saya mengembangkan website dan aplikasi sambil memperdalam kemampuan pemrograman.",
            "I am a Computer Science student at BINUS University, specialising in Software Engineering. Through university projects, I build websites and applications while developing my programming skills.",
          )}
        </p>
        <SocialLinks />
        <div className="about-facts">
          <div>
            <span>{t("UNIVERSITAS", "UNIVERSITY")}</span>
            <p>BINUS University</p>
          </div>
          <div>
            <span>{t("FOKUS", "FOCUS")}</span>
            <p>Web & Mobile Development</p>
          </div>
        </div>
      </Reveal>
      <div className="lanyard-area">
        <Lanyard />
      </div>
    </section>
  );
}
export function Contact() {
  const { t } = useCopy();
  const [status, setStatus] = useState("");
  return (
    <section id="contact" className="contact section container">
      <Reveal className="contact-copy">
        <span className="eyebrow">CONTACT</span>
        <h2>{t("Mari terhubung.", "Let’s connect.")}</h2>
        <p className="body-copy">
          {t(
            "Punya proyek, peluang kerja, atau sekadar ingin menyapa? Saya senang mendengarnya.",
            "Have a project, an opportunity, or just want to say hello? I’d love to hear from you.",
          )}
        </p>
        <a
          className="text-link"
          href={profile.github}
          target="_blank"
          rel="noreferrer"
        >
          <IconBrandGithub size={20} />
          github.com/As-arya
          <IconArrowUpRight size={18} />
        </a>
      </Reveal>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStatus(
            t(
              "Formulir ini masih pratinjau. Pesan belum dikirim. Kamu dapat menghubungi saya melalui GitHub.",
              "This form is a preview. Your message has not been sent. You can find me on GitHub.",
            ),
          );
        }}
        className="contact-form"
      >
        <label>
          {t("Nama", "Name")}
          <input
            name="name"
            autoComplete="name"
            placeholder={t("Nama kamu", "Your name")}
            required
            maxLength={100}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={254}
          />
        </label>
        <label>
          {t("Pesan", "Message")}
          <textarea
            name="message"
            placeholder={t(
              "Ceritakan sedikit tentang idemu...",
              "Tell me a little about your idea...",
            )}
            required
            maxLength={3000}
            rows={4}
          />
        </label>
        <div className="form-bottom">
          <button type="submit" className="pill primary">
            {t("Kirim pesan", "Send message")}
            <IconMail size={18} />
          </button>
          <span>{t("Formulir pratinjau", "Preview form")}</span>
        </div>
        <p role="status" className="form-status">
          {status}
        </p>
      </form>
    </section>
  );
}
export function Footer() {
  const { t } = useCopy();
  return (
    <footer className="footer container">
      <a className="wordmark" href="#home">
        Asarya
      </a>
      <p>© {new Date().getFullYear()} Asarya Jachred Alotia</p>
      <a href="#home" className="text-link">
        {t("Kembali ke atas", "Back to top")}
        <IconArrowUp size={17} />
      </a>
    </footer>
  );
}
