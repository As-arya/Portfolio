import { requirePrimary } from "../../../../lib/auth";
import { db } from "../../../../lib/firebase-admin";
import { errorResponse, jsonBody, object, sameOrigin } from "../../../../lib/http";
import { getCertificates } from "../../../../lib/repository";
import { validateCertificates } from "../../../../lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePrimary();
    return Response.json({ certificates: await getCertificates() });
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const certificates = validateCertificates(object(await jsonBody(request)).certificates);
    await db().collection("settings").doc("public").set({ certificates }, { merge: true });
    return Response.json({ certificates });
  } catch (error) { return errorResponse(error); }
}
