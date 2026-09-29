import { db } from "../../../lib/firebase-admin";
import { errorResponse, jsonBody, sameOrigin } from "../../../lib/http";
import { sendContactEmail } from "../../../lib/mail";
import type { ContactRecord } from "../../../lib/models";
import { verifyTurnstile } from "../../../lib/turnstile";
import { validateContact } from "../../../lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = validateContact(await jsonBody(request));
    await verifyTurnstile(input.turnstileToken);
    const ref = db().collection("contacts").doc();
    const contact: ContactRecord = {
      id: ref.id, name: input.name, email: input.email, message: input.message,
      createdAt: new Date().toISOString(), read: false, emailStatus: "pending",
    };
    await ref.set(contact);
    let emailStatus: "sent" | "failed" = "sent";
    try { await sendContactEmail(contact); }
    catch (error) {
      emailStatus = "failed";
      console.error("Contact notification failed", error);
    }
    try { await ref.update(emailStatus === "sent" ? { emailStatus } : { emailStatus, emailError: "Email gagal terkirim." }); }
    catch (error) { console.error("Contact notification status update failed", error); }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
