import { test, expect } from "@playwright/test";
import { validateContact, validateProject } from "../lib/validation";
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
