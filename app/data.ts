export const profile = {
  name: "Asarya Jachred Alotia",
  github: "https://github.com/As-arya",
  instagram: "https://www.instagram.com/ary_alotia/",
  linkedin: "https://www.linkedin.com/in/asarya-alotia-29i/",
};
export type Project = {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  summary: string;
  summaryEn: string;
  stack: string[];
  image: string;
  description: string;
  descriptionEn: string;
  repository: string;
  demo: string;
  images?: string[];
  video?: string;
  playStore?: string;
  placeholder: boolean;
};
// Replace these entries with real project content. Add entries here; both views update automatically.
export const projects: Project[] = [
  {
    id: "flutter-01",
    title: "Proyek Flutter 01",
    titleEn: "Flutter Project 01",
    category: "Aplikasi mobile",
    categoryEn: "Mobile application",
    summary:
      "Proyek aplikasi dari perkuliahan. Nama, fitur, dan kontribusi akan dilengkapi.",
    summaryEn:
      "A university application project. Name, features, and contributions will be added.",
    stack: ["Flutter", "Dart"],
    image: "",
    description:
      "Detail proyek, tanggung jawab pribadi, dan hasil pengembangan belum ditambahkan.",
    descriptionEn:
      "Project details, personal responsibilities, and development outcomes have not been added yet.",
    repository: "",
    demo: "",
    placeholder: true,
  },
  {
    id: "flutter-02",
    title: "Proyek Flutter 02",
    titleEn: "Flutter Project 02",
    category: "Aplikasi mobile",
    categoryEn: "Mobile application",
    summary:
      "Eksplorasi pengembangan aplikasi menggunakan Flutter dan Dart dalam proyek kampus.",
    summaryEn:
      "An exploration of application development with Flutter and Dart through university coursework.",
    stack: ["Flutter", "Dart"],
    image: "",
    description:
      "Screenshot, penjelasan fitur, dan pembelajaran dari proyek ini akan dilengkapi.",
    descriptionEn:
      "Screenshots, feature descriptions, and lessons from this project will be added.",
    repository: "",
    demo: "",
    placeholder: true,
  },
  {
    id: "next-project",
    title: "Proyek berikutnya",
    titleEn: "Next project",
    category: "Segera ditambahkan",
    categoryEn: "Coming soon",
    summary:
      "Ruang untuk proyek berikutnya. Konten ini masih berupa placeholder.",
    summaryEn: "A place for the next project. This entry is a placeholder.",
    stack: [],
    image: "",
    description: "Belum ada proyek ketiga yang ditambahkan.",
    descriptionEn: "A third project has not been added yet.",
    repository: "",
    demo: "",
    placeholder: true,
  },
];
export const skills = [
  {
    name: "TypeScript",
    icon: "typescript",
    category: "Frontend",
    url: "https://www.typescriptlang.org/",
  },
  {
    name: "Python",
    icon: "python",
    category: "Programming",
    url: "https://www.python.org/",
  },
  {
    name: "Flutter",
    icon: "flutter",
    category: "Mobile",
    url: "https://flutter.dev/",
  },
  {
    name: "HTML",
    icon: "html5",
    category: "Frontend",
    url: "https://html.spec.whatwg.org/",
  },
  {
    name: "CSS",
    icon: "css3",
    category: "Frontend",
    url: "https://www.w3.org/Style/CSS/",
  },
  {
    name: "Dart",
    icon: "dart",
    category: "Mobile",
    url: "https://dart.dev/",
  },
  {
    name: "Kotlin",
    icon: "kotlin",
    category: "Mobile",
    url: "https://kotlinlang.org/",
  },
  {
    name: "Java",
    icon: "java",
    category: "Programming",
    url: "https://dev.java/",
  },
  {
    name: "Git",
    icon: "git",
    category: "Tools",
    url: "https://git-scm.com/",
  },
  {
    name: "Next.js",
    icon: "nextjs",
    category: "Frontend",
    url: "https://nextjs.org/",
  },
  {
    name: "Node.js",
    icon: "nodejs",
    category: "Backend",
    url: "https://nodejs.org/",
  },
  {
    name: "Express.js",
    icon: "express",
    category: "Backend",
    url: "https://expressjs.com/",
  },
  {
    name: "C",
    icon: "c",
    category: "Programming",
    url: "https://open-std.org/jtc1/sc22/wg14/",
  },
  {
    name: "Android Studio",
    icon: "androidstudio",
    category: "Tools",
    url: "https://developer.android.com/studio",
  },
  { name: "Figma", icon: "figma", category: "Tools", url: "https://www.figma.com/" },
  { name: "MySQL", icon: "mysql", category: "Data & Deploy", url: "https://www.mysql.com/" },
  { name: "PostgreSQL", icon: "postgresql", category: "Data & Deploy", url: "https://www.postgresql.org/" },
  { name: "Supabase", icon: "supabase", category: "Data & Deploy", url: "https://supabase.com/" },
  { name: "Railway", icon: "railway", category: "Data & Deploy", url: "https://railway.com/" },
  { name: "Codex", icon: "codex", category: "AI Workflow", url: "https://openai.com/codex/" },
  { name: "Kiro", icon: "kiro", category: "AI Workflow", url: "https://kiro.dev/" },
  { name: "Claude Code", icon: "claude-code", category: "AI Workflow", url: "https://claude.com/product/claude-code" },
];
