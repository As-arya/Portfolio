export type Availability = "open_to_work" | "hired";

export type EducationLocale = {
  program: string;
  description: string;
  courseworkTitle?: string;
  courses: { title: string; description: string }[];
};

export type EducationRecord = {
  id: string;
  institution: string;
  logo?: Media | null;
  logoDisplay?: { scale: number; x: number; y: number };
  startYear: number;
  endYear: number | null;
  translations: { id: EducationLocale; en: EducationLocale };
};

export type Media = {
  publicId: string;
  url: string;
  altId: string;
  altEn: string;
};

export type CertificateRecord = {
  id: string;
  image: Media;
  translations: {
    id: { title: string; description: string };
    en: { title: string; description: string };
  };
};

export type Block = {
  id: string;
  type: "heading" | "paragraph" | "image";
  text?: string;
  image?: Media;
};

export type ProjectLocale = {
  title: string;
  category: string;
  summary: string;
  blocks: Block[];
};

export type ProjectRecord = {
  slug: string;
  status: "draft" | "published";
  order: number;
  stack: string[];
  coverImages: Media[];
  translations: { id: ProjectLocale; en: ProjectLocale };
  links: { repository: string; demo: string; video: string; playStore: string };
  placeholder: boolean;
};

export type ContactRecord = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
  emailStatus: "pending" | "sent" | "failed";
  emailError?: string;
};
