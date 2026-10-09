import { createHash } from "node:crypto";
import { db } from "./firebase-admin";
import { HttpError } from "./http";
import type { ContactRecord } from "./models";

export async function storeContact(contact: ContactRecord) {
  const database = db();
  const emailHash = createHash("sha256").update(contact.email).digest("hex");
  const limits = [
    { ref: database.collection("security").doc(`contact-email-${emailHash}`), max: 3 },
    { ref: database.collection("security").doc("contact-global"), max: 30 },
  ];
  const now = Date.now();
  const windowMs = 15 * 60_000;
  await database.runTransaction(async transaction => {
    const snapshots = await Promise.all(limits.map(limit => transaction.get(limit.ref)));
    const updates = snapshots.map((snapshot, index) => {
      const previous = snapshot.data();
      const active = typeof previous?.windowAt === "number" && now - previous.windowAt < windowMs;
      const count = active ? Number(previous.count) || 0 : 0;
      if (count >= limits[index].max) throw new HttpError(429, "Terlalu banyak pesan. Silakan coba lagi dalam 15 menit.");
      return { windowAt: active ? previous!.windowAt : now, count: count + 1, expiresAt: new Date(now + windowMs) };
    });
    limits.forEach((limit, index) => transaction.set(limit.ref, updates[index]));
    transaction.create(database.collection("contacts").doc(contact.id), contact);
  });
}
