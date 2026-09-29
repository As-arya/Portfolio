import { existsSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { projects } from "../app/data.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  throw new Error("Lengkapi FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY di .env.local.");
}

initializeApp({ credential: cert({
  projectId: FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
}) });
const db = getFirestore();

for (const [order, project] of projects.entries()) {
  const ref = db.collection("projects").doc(project.id);
  if ((await ref.get()).exists) continue;
  await ref.create({
    slug: project.id, status: "published", order,
    stack: project.stack, coverImages: [], placeholder: project.placeholder,
    translations: {
      id: { title: project.title, category: project.category, summary: project.summary, blocks: [{ id: "intro", type: "paragraph", text: project.description }] },
      en: { title: project.titleEn, category: project.categoryEn, summary: project.summaryEn, blocks: [{ id: "intro", type: "paragraph", text: project.descriptionEn }] },
    },
    links: { repository: project.repository, demo: project.demo, video: project.video ?? "", playStore: project.playStore ?? "" },
  });
  console.log(`Seeded ${project.id}`);
}
const settings = db.collection("settings").doc("public");
if (!(await settings.get()).exists) await settings.create({ availability: "open_to_work" });
console.log("Seed complete.");
