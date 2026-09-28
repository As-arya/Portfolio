"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import CountUp from "./count-up";
import DecryptedText from "./decrypted-text";
import { skills, profile } from "./data";
import GlassSurface from "./glass-surface";
import LogoLoop from "./logo-loop";
import type { Contribution } from "./github-contributions";
import { useCopy } from "./preferences";
import { Reveal } from "./sections";
import "./technology.css";

const PixelBlast = dynamic(() => import("./pixel-blast"), { ssr: false });

const logoRows = [
  skills.filter((skill) => ["Frontend", "Backend"].includes(skill.category) || skill.name === "Figma"),
  skills.filter((skill) => ["Mobile", "Programming"].includes(skill.category)),
  skills.filter((skill) => ["Data & Deploy", "Tools", "AI Workflow"].includes(skill.category) && skill.name !== "Figma"),
].map((row) => row.map((skill) => ({
  name: skill.name,
  src: `/icons/${skill.icon}.${skill.name === "Claude Code" ? "png" : "svg"}`,
  url: skill.url,
})));

type Activity = { days: Contribution[]; total: number; activeDays: number; longestStreak: number };

function GitHubActivity() {
  const { t } = useCopy();
  const username = new URL(profile.github).pathname.slice(1);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [failed, setFailed] = useState(false);
  const drag = useRef<{ x: number; scrollLeft: number } | null>(null);
  const showLatest = useCallback((element: HTMLDivElement | null) => {
    if (element) element.scrollLeft = element.scrollWidth - element.clientWidth;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/github-contributions", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("GitHub activity unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.days) || data.days.length < 300) throw new Error("Invalid GitHub activity");
        const days: Contribution[] = data.days.slice(-365);
        let activeDays = 0;
        let streak = 0;
        let longestStreak = 0;
        for (const day of days) {
          if (day.count > 0) {
            activeDays++;
            streak++;
            longestStreak = Math.max(longestStreak, streak);
          } else {
            streak = 0;
          }
        }
        setActivity({
          days,
          activeDays,
          longestStreak,
          total: days.reduce((sum, day) => sum + day.count, 0),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const blanks = activity ? new Date(`${activity.days[0].date}T00:00:00Z`).getUTCDay() : 0;
  const months = activity?.days.flatMap((day, index) => {
    if (index > 0 && !day.date.endsWith("-01")) return [];
    return [{
      label: new Intl.DateTimeFormat(t("id-ID", "en-US"), { month: "short", timeZone: "UTC" }).format(new Date(`${day.date}T00:00:00Z`)),
      column: Math.floor((index + blanks) / 7) + 1,
    }];
  }) ?? [];

  return (
    <GlassSurface
      className="activity-glass"
      width="100%"
      height="auto"
      borderRadius={28}
      blur={3}
      backgroundOpacity={0.16}
      opacity={0.7}
      saturation={1.15}
      distortionScale={-18}
      greenOffset={2}
      blueOffset={4}
    >
      <div className="github-activity">
        <div className="github-activity-heading">
          <div>
            <span className="eyebrow">{t("AKTIVITAS KODE", "CODING ACTIVITY")}</span>
            <h3>GitHub Activity<span className="accent-period">.</span></h3>
          </div>
          <p>{t("Grafik kontribusi langsung dari GitHub.", "Contribution graph directly from GitHub.")}</p>
        </div>
        {activity ? (
          <div className="activity-dashboard">
            <div className="activity-metrics">
              <div className="activity-metric activity-metric-main">
                <span className="eyebrow">{t("365 HARI TERAKHIR", "LAST 365 DAYS")}</span>
                <strong><CountUp to={activity.total} /></strong>
                <p>{t("kontribusi dalam setahun terakhir", "contributions in the last year")}</p>
              </div>
              <div className="activity-metric-pair">
                <div className="activity-metric">
                  <span className="eyebrow">{t("STREAK TERPANJANG", "LONGEST STREAK")}</span>
                  <strong><CountUp to={activity.longestStreak} /></strong>
                  <p>{t("hari", "days")}</p>
                </div>
                <div className="activity-metric">
                  <span className="eyebrow">{t("HARI AKTIF", "ACTIVE DAYS")}</span>
                  <strong><CountUp to={Math.round(activity.activeDays / activity.days.length * 100)} suffix="%" /></strong>
                  <p>{t("dari hari tercatat", "of recorded days")}</p>
                </div>
              </div>
            </div>
            <div className="activity-calendar-panel">
              <div
                ref={showLatest}
                className="activity-calendar-scroll"
                role="region"
                aria-label={t("Kalender kontribusi GitHub, tarik ke kanan untuk melihat bulan sebelumnya", "GitHub contribution calendar, drag right to see earlier months")}
                tabIndex={0}
                onPointerDown={(event) => {
                  if (event.pointerType !== "mouse" || event.button !== 0) return;
                  drag.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (drag.current) event.currentTarget.scrollLeft = drag.current.scrollLeft + drag.current.x - event.clientX;
                }}
                onPointerUp={() => { drag.current = null; }}
                onPointerCancel={() => { drag.current = null; }}
                onLostPointerCapture={() => { drag.current = null; }}
              >
                <div className="activity-calendar-inner">
                  <div className="activity-months" aria-hidden="true">
                    {months.filter((month, index) => index === months.length - 1 || month.column !== months[index + 1].column).map((month) => <span key={month.column} style={{ gridColumnStart: month.column }}>{month.label}</span>)}
                  </div>
                  <div className="activity-calendar-body">
                    <div className="activity-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
                    <div
                      className="github-activity-grid"
                      role="img"
                      aria-label={t("Grafik kontribusi GitHub satu tahun terakhir", "GitHub contribution graph for the last year")}
                    >
                      {Array.from({ length: blanks }, (_, index) => <span key={`blank-${index}`} className="activity-blank" />)}
                      {activity.days.map((day) => (
                        <span key={day.date} className={`activity-level-${day.level}`} title={`${day.date}: ${day.count} ${t("kontribusi", "contributions")}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="activity-calendar-footer">
                <span className="activity-handle">@{username} · {t("tarik ke kanan untuk bulan sebelumnya", "drag right for earlier months")}</span>
                <div className="github-activity-legend" aria-hidden="true">
                  <span>{t("Sedikit", "Less")}</span>
                  {[0, 1, 2, 3, 4].map((level) => <i key={level} className={`activity-level-${level}`} />)}
                  <span>{t("Banyak", "More")}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="github-activity-status" role="status">
            {failed
              ? t("Aktivitas belum dapat dimuat.", "Activity is unavailable.")
              : t("Memuat aktivitas GitHub...", "Loading GitHub activity...")}
          </p>
        )}
      </div>
    </GlassSurface>
  );
}

export default function Technology() {
  const { t } = useCopy();
  const activityZone = useRef<HTMLDivElement>(null);
  const [showEffect, setShowEffect] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShowEffect(true);
        observer.disconnect();
      }
    }, { rootMargin: "250px" });
    if (activityZone.current) observer.observe(activityZone.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section id="skill" className="technology section" aria-labelledby="technology-title">
      <div className="container technology-head">
        <Reveal>
          <h2 id="technology-title" aria-label="Technology."><DecryptedText text="Technology" replayLabel={t("Ulangi animasi Technology", "Replay Technology animation")} /><span className="accent-period">.</span></h2>
        </Reveal>
        <p>{t("Bahasa, framework, platform, dan alat yang saya gunakan untuk membangun produk digital.", "Languages, frameworks, platforms, and tools I use to build digital products.")}</p>
      </div>
      <div className="technology-loops">
        {logoRows.map((row, index) => (
          <LogoLoop
            key={index}
            logos={row}
            reverse={index === 1}
            label={t(`Baris teknologi ${index + 1}`, `Technology row ${index + 1}`)}
          />
        ))}
      </div>
      <div className="technology-activity" ref={activityZone}>
        <div className="activity-pixel" aria-hidden="true">{showEffect && <PixelBlast />}</div>
        <div className="container technology-activity-inner"><GitHubActivity /></div>
      </div>
    </section>
  );
}
