import { requirePrimary } from "../../../../lib/auth";
import { db } from "../../../../lib/firebase-admin";
import { errorResponse } from "../../../../lib/http";
import type { ContactRecord } from "../../../../lib/models";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePrimary();
    const snapshot = await db().collection("contacts").orderBy("createdAt", "desc").get();
    return Response.json({ contacts: snapshot.docs.map(doc => doc.data() as ContactRecord) });
  } catch (error) { return errorResponse(error); }
}
