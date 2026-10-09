import { cookies } from "next/headers";
import { auth } from "../../../../lib/firebase-admin";
import { roleFromIdToken, sessionRole, SESSION_AGE_MS, SESSION_COOKIE } from "../../../../lib/auth";
import { errorResponse, HttpError, jsonBody, object, sameOrigin } from "../../../../lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const role = await sessionRole();
    if (!role) throw new HttpError(401, "Login diperlukan.");
    return Response.json({ role });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const idToken = object(await jsonBody(request, 16_384)).idToken;
    if (typeof idToken !== "string" || idToken.length > 10000) throw new HttpError(400, "Token login tidak valid.");
    const role = await roleFromIdToken(idToken);
    const session = await auth().createSessionCookie(idToken, { expiresIn: SESSION_AGE_MS });
    (await cookies()).set(SESSION_COOKIE, session, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
      maxAge: SESSION_AGE_MS / 1000, path: "/",
    });
    return Response.json({ role });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    (await cookies()).delete(SESSION_COOKIE);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
