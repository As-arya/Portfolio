"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  IconBrandFigma,
  IconBrandMysql,
  IconBrandOpenai,
  IconBrandSupabase,
  IconCodeAi,
  IconDatabase,
  IconTrain,
} from "@tabler/icons-react";
import CountUp from "./count-up";
import { skills, profile } from "./data";
import GlassSurface from "./glass-surface";
import LogoLoop from "./logo-loop";
import { useCopy } from "./preferences";
import { Reveal } from "./sections";
import "./technology.css";

const PixelBlast = dynamic(() => import("./pixel-blast"), { ssr: false });

const extraIcons: Record<string, ReactNode> = {
  Figma: <IconBrandFigma />,
  MySQL: <IconBrandMysql />,
  PostgreSQL: <IconDatabase />,
  Supabase: <IconBrandSupabase />,
  Railway: <IconTrain />,
  Codex: <IconBrandOpenai />,
  Kiro: <b>K</b>,
  "Claude Code": <IconCodeAi />,
};

const logoRows = [
  skills.filter((skill) => ["Frontend", "Backend"].includes(skill.category) || skill.name === "Figma"),
  skills.filter((skill) => ["Mobile", "Programming"].includes(skill.category)),
  skills.filter((skill) => ["Data & Deploy", "Tools", "AI Workflow"].includes(skill.category) && skill.name !== "Figma"),
].map((row) => row.map((skill) => ({
  name: skill.name,
  src: skill.icon ? `/icons/${skill.icon}.svg` : undefined,
  icon: extraIcons[skill.name],
})));

type Contribution = { date: string; count: number; level: number };
type Activity = { days: Contribution[]; total: number; activeDays: number; longestStreak: number };

function GitHubActivity() {
  const { t } = useCopy();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const username = new URL(profile.github).pathname.slice(1);
    fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("GitHub activity unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.contributions)) throw new Error("Invalid GitHub activity");
        const days: Contribution[] = data.contributions.filter(
          (day: Contribution) =>
            /^\d{4}-\d{2}-\d{2}$/.test(day?.date) &&
            Number.isInteger(day.count) && day.count >= 0 &&
            Number.isInteger(day.level) && day.level >= 0 && day.level <= 4,
        );
        if (!days.length) throw new Error("Empty GitHub activity");
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
          total: Number.isInteger(data.total?.lastYear)
            ? data.total.lastYear
            : days.reduce((sum, day) => sum + day.count, 0),
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
            <h3>GitHub contributions<span className="accent-period">.</span></h3>
          </div>
          <p>{t("Jejak kontribusi publik dalam satu tahun terakhir.", "A year of public coding activity.")}</p>
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
              <div className="activity-calendar-scroll">
                <div className="activity-calendar-inner">
                  <div className="activity-months" aria-hidden="true">
                    {months.filter((month, index) => index === months.length - 1 || month.column !== months[index + 1].column).map((month) => <span key={month.column} style={{ gridColumnStart: month.column }}>{month.label}</span>)}
                  </div>
                  <div className="activity-calendar-body">
                    <div className="activity-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
                    <div
                      className="github-activity-grid"
                      role="img"
                      aria-label={t(`${activity.total} kontribusi GitHub dalam 365 hari terakhir`, `${activity.total} GitHub contributions in the last 365 days`)}
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
                <span className="activity-handle">@{new URL(profile.github).pathname.slice(1)}</span>
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
              ? t("Aktivitas GitHub belum dapat dimuat.", "GitHub activity is unavailable.")
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
          <span className="eyebrow">{t("TEKNOLOGI / 01", "TECHNOLOGY / 01")}</span>
          <h2 id="technology-title">Technology<span className="accent-period">.</span></h2>
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
