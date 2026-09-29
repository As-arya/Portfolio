import nodemailer from "nodemailer";

function transport() {
  const user = process.env.BACKUP_GMAIL_ADDRESS;
  const pass = process.env.BACKUP_GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Gmail cadangan belum dikonfigurasi.");
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

export async function sendContactEmail(contact: { name: string; email: string; message: string }) {
  if (!process.env.PRIMARY_ADMIN_EMAIL) throw new Error("Email admin utama belum dikonfigurasi.");
  await transport().sendMail({
    from: process.env.BACKUP_GMAIL_ADDRESS,
    to: process.env.PRIMARY_ADMIN_EMAIL,
    replyTo: contact.email,
    subject: `Portfolio contact: ${contact.name}`,
    text: `Nama: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`,
  });
}

export async function sendRecoveryEmail(link: string) {
  if (!process.env.BACKUP_ADMIN_EMAIL) throw new Error("Email cadangan belum dikonfigurasi.");
  await transport().sendMail({
    from: process.env.BACKUP_GMAIL_ADDRESS,
    to: process.env.BACKUP_ADMIN_EMAIL,
    subject: "Pemulihan admin portofolio",
    text: `Tautan reset sandi akun admin utama:\n${link}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
  });
}
