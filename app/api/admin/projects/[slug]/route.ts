import { requirePrimary } from "../../../../../lib/auth";
import { db } from "../../../../../lib/firebase-admin";
import { errorResponse, HttpError, jsonBody, sameOrigin } from "../../../../../lib/http";
import { validateProject } from "../../../../../lib/validation";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const { slug } = await params;
    const project = validateProject(await jsonBody(request));
    if (project.slug !== slug) throw new HttpError(400, "Slug proyek tidak dapat diubah.");
    const ref = db().collection("projects").doc(slug);
    if (!(await ref.get()).exists) throw new HttpError(404, "Proyek tidak ditemukan.");
    await ref.set(project);
    return Response.json({ project });
  } catch (error) { return errorResponse(error); }
}
