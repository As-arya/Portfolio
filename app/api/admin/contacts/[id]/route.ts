import { requirePrimary } from "../../../../../lib/auth";
import { db } from "../../../../../lib/firebase-admin";
import { errorResponse, HttpError, jsonBody, object, sameOrigin } from "../../../../../lib/http";
import type { ContactRecord } from "../../../../../lib/models";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const read = object(await jsonBody(request)).read;
    if (typeof read !== "boolean") throw new HttpError(400, "Status baca tidak valid.");
    const { id } = await params;
    if (!/^[a-zA-Z0-9]{20}$/.test(id)) throw new HttpError(404, "Pesan tidak ditemukan.");
    const ref = db().collection("contacts").doc(id);
    if (!(await ref.get()).exists) throw new HttpError(404, "Pesan tidak ditemukan.");
    await ref.update({ read });
    return Response.json({ contact: (await ref.get()).data() as ContactRecord });
  } catch (error) { return errorResponse(error); }
}
