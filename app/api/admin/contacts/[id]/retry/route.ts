import { FieldValue } from "firebase-admin/firestore";
import { requirePrimary } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/firebase-admin";
import { errorResponse, HttpError, sameOrigin } from "../../../../../../lib/http";
import { sendContactEmail } from "../../../../../../lib/mail";
import type { ContactRecord } from "../../../../../../lib/models";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    await requirePrimary();
    const { id } = await params;
    if (!/^[a-zA-Z0-9]{20}$/.test(id)) throw new HttpError(404, "Pesan tidak ditemukan.");
    const ref = db().collection("contacts").doc(id);
    const contact = await db().runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpError(404, "Pesan tidak ditemukan.");
      const record = snapshot.data() as ContactRecord;
      if (record.emailStatus !== "failed") throw new HttpError(409, "Hanya email gagal yang dapat dikirim ulang.");
      transaction.update(ref, { emailStatus: "pending", emailError: FieldValue.delete() });
      return record;
    });
    let emailStatus: "sent" | "failed" = "sent";
    try { await sendContactEmail(contact); }
    catch (error) {
      emailStatus = "failed";
      console.error("Contact retry failed", error);
    }
    await ref.update(emailStatus === "sent" ? { emailStatus } : { emailStatus, emailError: "Email gagal terkirim." });
    return Response.json({ contact: (await ref.get()).data() as ContactRecord });
  } catch (error) { return errorResponse(error); }
}
