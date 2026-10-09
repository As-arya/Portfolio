"use client";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import dynamic from "next/dynamic";
import Script from "next/script";
import {
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import GlassSurface from "./glass-surface";
import {
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
import ScrollReveal from "./scroll-reveal";
const Lanyard = dynamic(() => import("./lanyard"), {
  ssr: false,
  loading: () => (
    <div className="lanyard-loading" aria-label="Loading lanyard" />
  ),
});
const PixelBlast = dynamic(() => import("./pixel-blast"), { ssr: false });

type Turnstile = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV === "development" ? "1x00000000000000000000AA" : "");

function turnstile() {
  return (window as Window & { turnstile?: Turnstile }).turnstile;
}

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
      className={`motion-reveal ${className}`}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduced ? 0 : 0.55, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
export function Header({ homeLinks = false }: { homeLinks?: boolean }) {
  const { lang, setLang, t } = useCopy();
  const [theme, setTheme] = useState("light");
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("about");
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
    if (location.hash === "#home") {
      history.replaceState(null, "", "#about");
      window.scrollTo({ top: 0, behavior: "instant" });
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
  function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const changeTheme = () => {
      root.dataset.theme = next;
      flushSync(() => setTheme(next));
      try {
        localStorage.setItem("portfolio-theme", next);
      } catch {}
    };
    if (reduced || !document.startViewTransition) {
      changeTheme();
      return;
    }

    const button = event.currentTarget.getBoundingClientRect();
    const x = button.left + button.width / 2;
    const y = button.top + button.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(changeTheme);
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
      );
    }).catch(() => {});
  }
  return (
    <header className={`nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      <motion.nav
        className="navbar"
        aria-label="Main navigation"
      >
        <GlassSurface className="glass-layer" width="100%" height="100%" borderRadius={999} backgroundOpacity={0.55} saturation={1.15} distortionScale={-28} greenOffset={2} blueOffset={4} />
        <a
          href={homeLinks ? "/#about" : "#about"}
          className="wordmark"
          aria-label="Asarya — About"
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
            ["about", "About"],
            ["education", "Education"],
            ["skill", "Technology"],
            ["projects", "Projects"],
            ["certificates", "Certificates"],
            ["contact", "Contact"],
          ].map(([id, name]) => (
            <a
              key={id}
              href={`${homeLinks ? "/" : ""}#${id}`}
              className={!homeLinks && active === id ? "active" : ""}
              aria-current={!homeLinks && active === id ? "location" : undefined}
              onClick={() => setMenu(false)}
            >
              {!homeLinks && active === id && (
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
export function About({ availability }: { availability: "open_to_work" | "hired" }) {
  const { t } = useCopy();
  const nameRef = useRef<HTMLHeadingElement>(null);
  const nameInView = useInView(nameRef, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  const name = profile.name.replace(" ", "\n");
  const [typedName, setTypedName] = useState("");
  useEffect(() => {
    if (!nameInView || reduced) {
      setTypedName(reduced ? name : "");
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index++;
      setTypedName(name.slice(0, index));
      if (index === name.length) window.clearInterval(timer);
    }, 65);
    return () => window.clearInterval(timer);
  }, [nameInView, reduced]);
  return (
    <section id="about" className="about section container" aria-labelledby="about-title">
      <div className="about-copy">
        <div className="about-topline"><span className="eyebrow">ABOUT ME</span><span className="availability"><i />{availability === "hired" ? t("Sudah bekerja", "Hired") : t("Terbuka untuk kerja", "Open to work")}</span></div>
        <h1 id="about-title" ref={nameRef} className="typing-name" aria-label={`${profile.name}.`}>
          <span aria-hidden="true" className="typing-name-text">{typedName}</span>
          {typedName === name && <span aria-hidden="true" className="accent-period">.</span>}
          <span aria-hidden="true" className="typing-cursor" />
        </h1>
        <p className="role-line">
          Computer Science Student<span>Software Engineering</span>
        </p>
        <ScrollReveal
          text={t(
            "Saya mahasiswa Computer Science di BINUS University dengan peminatan Software Engineering. Saya senang membangun aplikasi mobile dan website, mulai dari merancang antarmuka hingga menghubungkannya dengan backend dan data. Melalui beberapa proyek perkuliahan, saya mendapat pengalaman bekerja secara fullstack dan mengembangkan fitur yang berangkat dari kebutuhan pengguna. Saya ingin terus mengasah kemampuan tersebut dan berfokus pada aplikasi serta website yang berguna dan mudah digunakan.",
            "I study Computer Science at BINUS University with a focus on Software Engineering. I enjoy building mobile apps and websites, from designing interfaces to connecting them with backend services and data. Through university projects, I have gained fullstack experience and built features around users' needs. I want to keep improving those skills and focus on making apps and websites that are useful and easy to use.",
          )}
        />
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
      </div>
      <div className="lanyard-area">
        <Lanyard
          frontImage="/lanyard/front.png"
          backImage="/lanyard/back.png"
          imageFit="cover"
          strapImage="/lanyard/strap.png"
        />
      </div>
    </section>
  );
}
export function Contact() {
  const { t } = useCopy();
  const [notice, setNotice] = useState<"none" | "challenge" | "sent" | "error">("none");
  const [pending, setPending] = useState(false);
  const [token, setToken] = useState("");
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  useEffect(() => {
    renderChallenge();
    return () => {
      if (widgetId.current) turnstile()?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  function renderChallenge() {
    if (!turnstileSiteKey || !widgetContainer.current || widgetId.current || !turnstile()) return;
    widgetId.current = turnstile()!.render(widgetContainer.current, {
      sitekey: turnstileSiteKey,
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => { setToken(""); setNotice("challenge"); },
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!token) { setNotice("challenge"); return; }
    const form = event.currentTarget;
    const fields = new FormData(form);
    setPending(true);
    setNotice("none");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.get("name"),
          email: fields.get("email"),
          message: fields.get("message"),
          turnstileToken: token,
        }),
      });
      if (!response.ok) throw new Error("Contact request failed");
      form.reset();
      setNotice("sent");
    } catch {
      setNotice("error");
    } finally {
      setPending(false);
      setToken("");
      if (widgetId.current) turnstile()?.reset(widgetId.current);
    }
  }
  return (
    <section id="contact" className="contact section container">
      <div className="contact-pixel" aria-hidden="true"><PixelBlast /></div>
      <Reveal className="contact-copy">
        <h2>Let’s connect.</h2>
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
      <form onSubmit={submit} className="contact-form">
        <label>
          {t("Nama", "Name")}
          <input
            name="name"
            autoComplete="name"
            placeholder="John Doe"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="john.doe@example.com"
            required
            maxLength={254}
          />
        </label>
        <label>
          {t("Pesan", "Message")}
          <textarea
            name="message"
            placeholder={t(
              "Halo Asarya, saya ingin membahas proyek website...",
              "Hi Asarya, I’d like to discuss a website project...",
            )}
            required
            minLength={10}
            maxLength={3000}
            rows={4}
          />
        </label>
        {turnstileSiteKey ? (
          <>
            <div ref={widgetContainer} className="turnstile-widget" aria-label={t("Verifikasi keamanan", "Security verification")} />
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={renderChallenge} onError={() => setNotice("challenge")} />
          </>
        ) : <p className="form-status">{t("Formulir belum dikonfigurasi. Hubungi pemilik situs.", "The form is not configured. Please contact the site owner.")}</p>}
        <div className="form-bottom">
          <button type="submit" className="pill primary" disabled={pending || !turnstileSiteKey}>
            {pending ? t("Mengirim...", "Sending...") : t("Kirim pesan", "Send message")}
            <IconMail size={18} />
          </button>
          <span>{t("Dilindungi verifikasi keamanan", "Protected by security verification")}</span>
        </div>
        <p role={notice === "error" || notice === "challenge" ? "alert" : "status"} className="form-status">
          {notice === "challenge" ? t("Selesaikan verifikasi keamanan terlebih dahulu.", "Complete the security check first.") :
            notice === "sent" ? t("Pesan berhasil diterima. Terima kasih!", "Message received. Thank you!") :
              notice === "error" ? t("Pesan gagal dikirim. Coba lagi sebentar lagi.", "Message could not be sent. Please try again.") : ""}
        </p>
      </form>
    </section>
  );
}
export function Footer({ homeLinks = false }: { homeLinks?: boolean }) {
  const { t } = useCopy();
  return (
    <footer className="footer container">
      <a className="wordmark" href={homeLinks ? "/#about" : "#about"}>
        Asarya
      </a>
      <p>© {new Date().getFullYear()} Asarya Jachred Alotia</p>
      <a href={homeLinks ? "#project-content" : "#about"} className="text-link">
        {t("Kembali ke atas", "Back to top")}
        <IconArrowUp size={17} />
      </a>
    </footer>
  );
}
