import { requirePrimary } from "../../../../../lib/auth";
import { db } from "../../../../../lib/firebase-admin";
import { errorResponse, HttpError, jsonBody, object, sameOrigin } from "../../../../../lib/http";
import { getAllProjects } from "../../../../../lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const slugs = object(await jsonBody(request)).slugs;
    const projects = await getAllProjects();
    if (!Array.isArray(slugs) || slugs.length !== projects.length || new Set(slugs).size !== projects.length || projects.some(project => !slugs.includes(project.slug))) {
      throw new HttpError(400, "Urutan proyek tidak valid.");
    }
    const batch = db().batch();
    slugs.forEach((slug, order) => batch.update(db().collection("projects").doc(slug), { order }));
    await batch.commit();
    return Response.json({ projects: await getAllProjects() });
  } catch (error) { return errorResponse(error); }
}
