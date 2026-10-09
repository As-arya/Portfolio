import { test, expect } from "@playwright/test";
import { validateCertificates, validateContact, validateEducation, validateProject } from "../lib/validation";
import { sampleCertificates, sampleEducation } from "../app/sample-content";
import { roleForUser } from "../lib/auth";
import { sameOrigin } from "../lib/http";

const draft = {
  slug: "sample", status: "draft", order: 0, stack: [], coverImages: [], placeholder: false,
  translations: {
    id: { title: "Contoh", category: "Web", summary: "Ringkasan", blocks: [{ id: "intro", type: "paragraph", text: "Isi proyek" }] },
    en: { title: "Example", category: "Web", summary: "Summary", blocks: [{ id: "intro", type: "paragraph", text: "Project details" }] },
  },
  links: { repository: "", demo: "", video: "", playStore: "" },
};

test("publishing requires both languages and safe links", () => {
  expect(validateProject(draft).status).toBe("draft");
  expect(() => validateProject({ ...draft, status: "published", translations: { ...draft.translations, en: { ...draft.translations.en, summary: "" } } })).toThrow();
  expect(() => validateProject({ ...draft, links: { ...draft.links, demo: "javascript:alert(1)" } })).toThrow();
});

const education = {
  id: "university", institution: "Example University", startYear: 2023, endYear: null,
  translations: {
    id: { program: "Ilmu Komputer", description: "", courses: [{ title: "Algoritma", description: "Struktur data" }] },
    en: { program: "Computer Science", description: "", courses: [] },
  },
};

test("education accepts ongoing and completed study with optional coursework", () => {
  expect(validateEducation([education])[0].endYear).toBeNull();
  expect(validateEducation([{ ...education, endYear: 2026 }])[0].endYear).toBe(2026);
  expect(validateEducation([])).toEqual([]);
  expect(validateEducation([{ ...education, institution: "  Example University  " }])[0].institution).toBe("Example University");
  expect(validateProject({ ...draft, stack: ["Flutter", " Flutter ", "Custom SDK"] }).stack).toEqual(["Flutter", "Custom SDK"]);
});

test("education rejects invalid dates, duplicate entries and malformed content", () => {
  for (const invalid of [
    { ...education, startYear: "2023" },
    { ...education, startYear: 2023.5 },
    { ...education, startYear: 1899 },
    { ...education, endYear: 2101 },
    { ...education, endYear: 2022 },
    { ...education, endYear: undefined },
    { ...education, institution: " " },
    { ...education, translations: { ...education.translations, en: { ...education.translations.en, program: "" } } },
    { ...education, translations: { ...education.translations, id: { ...education.translations.id, courses: [{ title: "", description: "" }] } } },
  ]) expect(() => validateEducation([invalid])).toThrow();
  expect(() => validateEducation([education, education])).toThrow();
  expect(() => validateEducation(Array(21).fill(education))).toThrow();
  expect(() => validateEducation({})).toThrow();
});

test("education validates optional logos and editable bilingual coursework titles", () => {
  const custom = { ...education, logo: { publicId: "portfolio/logo", url: "https://res.cloudinary.com/demo/image/upload/logo.png", altId: "Logo", altEn: "Logo" }, translations: { ...education.translations, id: { ...education.translations.id, courseworkTitle: "Materi pilihan" }, en: { ...education.translations.en, courseworkTitle: "Highlights" } } };
  expect(validateEducation([custom])[0].translations.id.courseworkTitle).toBe("Materi pilihan");
  expect(validateEducation([custom])[0].translations.en.courseworkTitle).toBe("Highlights");
  expect(validateEducation([custom])[0].logo.publicId).toBe("portfolio/logo");
  expect(validateEducation([education])[0].logo).toBeNull();
  expect(validateEducation([education])[0].translations.id.courseworkTitle).toBe("");
  for (const logo of [
    { ...custom.logo, url: "javascript:alert(1)" },
    { ...sampleEducation[0].logo, url: "/forged.svg" },
    { ...sampleEducation[0].logo, publicId: "sample/forged" },
  ]) expect(() => validateEducation([{ ...custom, logo }])).toThrow();
  expect(() => validateEducation([{ ...custom, translations: { ...custom.translations, id: { ...custom.translations.id, courseworkTitle: "x".repeat(161) } } }])).toThrow();
});

test("sample education and certificates are valid editable records", () => {
  expect(validateEducation(sampleEducation)).toEqual(sampleEducation);
  expect(validateCertificates(sampleCertificates)).toEqual(sampleCertificates);
  expect(validateCertificates([])).toEqual([]);
  const custom = { ...sampleCertificates[0], image: { publicId: "portfolio/certificate", url: "https://res.cloudinary.com/demo/image/upload/certificate.png", altId: "", altEn: "" } };
  expect(validateCertificates([custom])[0].image.publicId).toBe("portfolio/certificate");
});

test("certificate input requires titles and a trusted image", () => {
  const sample = sampleCertificates[0];
  for (const invalid of [
    { ...sample, id: "bad/id" },
    { ...sample, image: null },
    { ...sample, image: { ...sample.image, url: "/other.svg" } },
    { ...sample, image: { ...sample.image, publicId: "sample/forged" } },
    { ...sample, image: { publicId: "portfolio/image", url: "javascript:alert(1)", altId: "", altEn: "" } },
    { ...sample, translations: { ...sample.translations, en: { title: " ", description: "" } } },
  ]) expect(() => validateCertificates([invalid])).toThrow();
  expect(() => validateCertificates([sample, sample])).toThrow();
  expect(() => validateCertificates(Array(31).fill(sample))).toThrow();
});

test("contact input rejects invalid trust-boundary values", () => {
  expect(validateContact({ name: "Ada", email: "ADA@example.com", message: "Hello there!", turnstileToken: "token" }).email).toBe("ada@example.com");
  expect(() => validateContact({ name: "A", email: "bad", message: "x", turnstileToken: "" })).toThrow();
  expect(() => validateContact({ name: "Ada\nBcc: victim@example.com", email: "ada@example.com", message: "Hello there!", turnstileToken: "token" })).toThrow();
});

test("backup Google account cannot gain primary permissions", () => {
  const previous = {
    PRIMARY_ADMIN_UID: process.env.PRIMARY_ADMIN_UID,
    PRIMARY_ADMIN_EMAIL: process.env.PRIMARY_ADMIN_EMAIL,
    BACKUP_ADMIN_UID: process.env.BACKUP_ADMIN_UID,
    BACKUP_ADMIN_EMAIL: process.env.BACKUP_ADMIN_EMAIL,
  };
  try {
    process.env.PRIMARY_ADMIN_UID = "primary-uid";
    process.env.PRIMARY_ADMIN_EMAIL = "primary@example.com";
    process.env.BACKUP_ADMIN_UID = "backup-uid";
    process.env.BACKUP_ADMIN_EMAIL = "backup@example.com";
    expect(roleForUser("primary-uid", "primary@example.com", "password", false)).toBe("primary");
    expect(roleForUser("backup-uid", "backup@example.com", "google.com", true)).toBe("recovery");
    expect(roleForUser("backup-uid", "backup@example.com", "password", true)).toBeNull();
    expect(roleForUser("primary-uid", "backup@example.com", "password", true)).toBeNull();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("same-origin check uses the incoming host", () => {
  const request = (host, origin) => new Request("http://localhost:3000/api/admin/session", {
    method: "POST", headers: { host, origin },
  });
  expect(() => sameOrigin(request("127.0.0.1:3000", "http://127.0.0.1:3000"))).not.toThrow();
  expect(() => sameOrigin(request("127.0.0.1:3000", "http://other.local:3000"))).toThrow();
  expect(() => sameOrigin(request("127.0.0.1:3000", "https://127.0.0.1:3000"))).toThrow();
});
