import { randomBytes } from "node:crypto";
import { requirePrimary } from "../../../../lib/auth";
import { db } from "../../../../lib/firebase-admin";
import { errorResponse, HttpError, jsonBody, object, sameOrigin } from "../../../../lib/http";
import { getAllProjects } from "../../../../lib/repository";
import { slugFromTitle, validateProject } from "../../../../lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePrimary();
    return Response.json({ projects: await getAllProjects() });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const source = object(await jsonBody(request));
    if (source.slug !== "") throw new HttpError(400, "Proyek baru harus memakai slug otomatis.");
    const translations = object(source.translations);
    const id = object(translations.id);
    const base = slugFromTitle(id.title);
    const existing = await getAllProjects();
    const slug = existing.some(item => item.slug === base) ? `${base}-${randomBytes(3).toString("hex")}` : base;
    const project = validateProject({ ...source, slug, order: Math.max(-1, ...existing.map(item => item.order)) + 1 });
    await db().collection("projects").doc(slug).create(project);
    return Response.json({ project }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
