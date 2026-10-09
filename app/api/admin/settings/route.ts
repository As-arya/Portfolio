import { requirePrimary } from "../../../../lib/auth";
import { db } from "../../../../lib/firebase-admin";
import { errorResponse, HttpError, jsonBody, object, sameOrigin } from "../../../../lib/http";
import { getAvailability } from "../../../../lib/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePrimary();
    return Response.json({ availability: await getAvailability() });
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const availability = object(await jsonBody(request)).availability;
    if (availability !== "open_to_work" && availability !== "hired") throw new HttpError(400, "Status kerja tidak valid.");
    await db().collection("settings").doc("public").set({ availability }, { merge: true });
    return Response.json({ availability });
  } catch (error) { return errorResponse(error); }
}
