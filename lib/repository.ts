import { projects as legacyProjects, type Project as LegacyProject } from "../app/data";
import { requirePrimary } from "./auth";
import { db, firebaseConfigured } from "./firebase-admin";
import type { Availability, CertificateRecord, EducationRecord, ProjectRecord } from "./models";
import { sampleCertificates, sampleEducation } from "../app/sample-content";

export function legacyProject(project: LegacyProject, order: number): ProjectRecord {
  return {
    slug: project.id,
    status: "published",
    order,
    stack: project.stack,
    coverImages: [],
    translations: {
      id: { title: project.title, category: project.category, summary: project.summary, blocks: [{ id: "intro", type: "paragraph", text: project.description }] },
      en: { title: project.titleEn, category: project.categoryEn, summary: project.summaryEn, blocks: [{ id: "intro", type: "paragraph", text: project.descriptionEn }] },
    },
    links: { repository: project.repository, demo: project.demo, video: project.video ?? "", playStore: project.playStore ?? "" },
    placeholder: project.placeholder,
  };
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
  if (!firebaseConfigured()) return legacyProjects.map(legacyProject);
  // ponytail: full scan suits a small portfolio; paginate when project count grows into hundreds.
  const snapshot = await db().collection("projects").get();
  return snapshot.docs.map(doc => doc.data() as ProjectRecord).sort((a, b) => a.order - b.order);
}

export async function getPublishedProjects(): Promise<ProjectRecord[]> {
  return (await getAllProjects()).filter(project => project.status === "published");
}

export async function getProject(slug: string, options?: { includeDraft?: boolean }): Promise<ProjectRecord | null> {
  if (options?.includeDraft) await requirePrimary();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const project = firebaseConfigured()
    ? (await db().collection("projects").doc(slug).get()).data() as ProjectRecord | undefined
    : legacyProjects.map(legacyProject).find(item => item.slug === slug);
  return project && (project.status === "published" || options?.includeDraft) ? project : null;
}

export async function getAvailability(): Promise<Availability> {
  if (!firebaseConfigured()) return "open_to_work";
  const value = (await db().collection("settings").doc("public").get()).data()?.availability;
  return value === "hired" ? "hired" : "open_to_work";
}

export async function getEducation(): Promise<EducationRecord[]> {
  if (!firebaseConfigured()) return sampleEducation;
  return (await db().collection("settings").doc("public").get()).data()?.education ?? sampleEducation;
}

export async function getCertificates(): Promise<CertificateRecord[]> {
  if (!firebaseConfigured()) return sampleCertificates;
  return (await db().collection("settings").doc("public").get()).data()?.certificates ?? sampleCertificates;
}
