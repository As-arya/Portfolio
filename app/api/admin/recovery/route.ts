import { requireRecovery } from "../../../../lib/auth";
import { auth, db } from "../../../../lib/firebase-admin";
import { errorResponse, HttpError, sameOrigin } from "../../../../lib/http";
import { sendRecoveryEmail } from "../../../../lib/mail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireRecovery();
    const email = process.env.PRIMARY_ADMIN_EMAIL;
    if (!email) throw new HttpError(503, "Email admin belum dikonfigurasi.");
    const marker = db().collection("security").doc("recovery");
    const now = Date.now();
    await db().runTransaction(async transaction => {
      const lastAt = (await transaction.get(marker)).data()?.lastAt as number | undefined;
      if (lastAt && now - lastAt < 15 * 60_000) throw new HttpError(429, "Tunggu 15 menit sebelum meminta tautan lagi.");
      transaction.set(marker, { lastAt: now });
    });
    try {
      const link = await auth().generatePasswordResetLink(email);
      await sendRecoveryEmail(link);
    } catch (error) {
      await marker.update({ lastAt: 0 }).catch(console.error);
      throw error;
    }
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
