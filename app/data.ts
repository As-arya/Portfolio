export const profile = {
  name: "Asarya Jachred Alotia",
  github: "https://github.com/As-arya",
  instagram: "",
  linkedin: "",
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
  },
  {
    name: "Python",
    icon: "python",
    category: "Programming",
  },
  {
    name: "Flutter",
    icon: "flutter",
    category: "Mobile",
  },
  {
    name: "HTML",
    icon: "html5",
    category: "Frontend",
  },
  {
    name: "CSS",
    icon: "css3",
    category: "Frontend",
  },
  {
    name: "Dart",
    icon: "dart",
    category: "Mobile",
  },
  {
    name: "Kotlin",
    icon: "kotlin",
    category: "Mobile",
  },
  {
    name: "Java",
    icon: "java",
    category: "Programming",
  },
  {
    name: "Git",
    icon: "git",
    category: "Tools",
  },
  {
    name: "Next.js",
    icon: "nextjs",
    category: "Frontend",
  },
  {
    name: "Node.js",
    icon: "nodejs",
    category: "Backend",
  },
  {
    name: "Express.js",
    icon: "express",
    category: "Backend",
  },
  {
    name: "C",
    icon: "c",
    category: "Programming",
  },
  {
    name: "Android Studio",
    icon: "androidstudio",
    category: "Tools",
  },
  { name: "Figma", icon: "", category: "Tools" },
  { name: "MySQL", icon: "", category: "Data & Deploy" },
  { name: "PostgreSQL", icon: "", category: "Data & Deploy" },
  { name: "Supabase", icon: "", category: "Data & Deploy" },
  { name: "Railway", icon: "", category: "Data & Deploy" },
  { name: "Codex", icon: "", category: "AI Workflow" },
  { name: "Kiro", icon: "", category: "AI Workflow" },
  { name: "Claude Code", icon: "", category: "AI Workflow" },
];
