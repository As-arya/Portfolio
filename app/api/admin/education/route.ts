import { requirePrimary } from "../../../../lib/auth";
import { db } from "../../../../lib/firebase-admin";
import { errorResponse, jsonBody, object, sameOrigin } from "../../../../lib/http";
import { getEducation } from "../../../../lib/repository";
import { validateEducation } from "../../../../lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePrimary();
    return Response.json({ education: await getEducation() });
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const education = validateEducation(object(await jsonBody(request)).education);
    await db().collection("settings").doc("public").set({ education }, { merge: true });
    return Response.json({ education });
  } catch (error) { return errorResponse(error); }
}
