import { requireRecovery } from "../../../../lib/auth";
import { auth, db } from "../../../../lib/firebase-admin";
import { errorResponse, HttpError, sameOrigin } from "../../../../lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireRecovery();
    const email = process.env.PRIMARY_ADMIN_EMAIL;
    if (!email) throw new HttpError(503, "Email admin belum dikonfigurasi.");
    const marker = db().collection("security").doc("recovery");
    const now = Date.now();
    const existingLink = await db().runTransaction(async transaction => {
      const previous = (await transaction.get(marker)).data();
      const lastAt = previous?.lastAt as number | undefined;
      if (lastAt && now - lastAt < 15 * 60_000) {
        if (typeof previous?.resetLink === "string" && previous.resetLink) return previous.resetLink;
        throw new HttpError(429, "Tautan belum tersedia. Coba kembali beberapa saat lagi.");
      }
      transaction.set(marker, { lastAt: now, resetLink: "" });
      return "";
    });
    if (existingLink) return Response.json({ resetLink: existingLink }, { headers: { "Cache-Control": "no-store" } });
    try {
      const resetLink = await auth().generatePasswordResetLink(email);
      await marker.update({ resetLink });
      return Response.json({ resetLink }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      await marker.update({ lastAt: 0, resetLink: "" }).catch(console.error);
      throw error;
    }
  } catch (error) { return errorResponse(error); }
}
