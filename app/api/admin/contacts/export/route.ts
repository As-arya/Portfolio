import { requirePrimary } from "../../../../../lib/auth";
import { db } from "../../../../../lib/firebase-admin";
import { errorResponse } from "../../../../../lib/http";
import type { ContactRecord } from "../../../../../lib/models";
import { cell } from "../../../../../lib/csv";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePrimary();
    const snapshot = await db().collection("contacts").orderBy("createdAt", "desc").get();
    const rows = ["Date,Name,Email,Message,Read,Email status", ...snapshot.docs.map(doc => {
      const item = doc.data() as ContactRecord;
      return [item.createdAt, item.name, item.email, item.message, String(item.read), item.emailStatus].map(cell).join(",");
    })];
    return new Response(`\uFEFF${rows.join("\r\n")}`, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="portfolio-contacts.csv"', "Cache-Control": "no-store" },
    });
  } catch (error) { return errorResponse(error); }
}
