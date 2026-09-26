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
    color: "#1269da",
    category: "Language",
    focus: "Tipe data, pemodelan objek, dan logika aplikasi.",
    focusEn: "Types, object modelling, and application logic.",
  },
  {
    name: "Python",
    icon: "python",
    color: "#e3a400",
    category: "Language",
    focus: "Dasar pemrograman, pengolahan data, dan scripting.",
    focusEn: "Programming fundamentals, data processing, and scripting.",
  },
  {
    name: "Flutter",
    icon: "flutter",
    color: "#007ba8",
    category: "Mobile",
    focus: "Antarmuka mobile, navigasi, dan pengembangan aplikasi.",
    focusEn: "Mobile interfaces, navigation, and application development.",
  },
  {
    name: "HTML",
    icon: "html5",
    color: "#cd3719",
    category: "Web",
    focus: "Struktur halaman dan elemen web semantik.",
    focusEn: "Page structure and semantic web elements.",
  },
  {
    name: "CSS",
    icon: "css3",
    color: "#175dd8",
    category: "Web",
    focus: "Layout, responsive styling, dan animasi antarmuka.",
    focusEn: "Layouts, responsive styling, and interface animation.",
  },
  {
    name: "Dart",
    icon: "dart",
    color: "#087c91",
    category: "Language",
    focus: "Logika dan struktur aplikasi Flutter.",
    focusEn: "Logic and structure for Flutter applications.",
  },
  {
    name: "Kotlin",
    icon: "kotlin",
    color: "#842ddd",
    category: "Mobile",
    focus: "Pengembangan aplikasi Android.",
    focusEn: "Android application development.",
  },
  {
    name: "Java",
    icon: "java",
    color: "#ba4a09",
    category: "Language",
    focus: "Pemrograman berorientasi objek dan dasar aplikasi.",
    focusEn: "Object-oriented programming and application fundamentals.",
  },
  {
    name: "Git",
    icon: "git",
    color: "#c73520",
    category: "Tools",
    focus: "Version control dan pengelolaan perubahan kode.",
    focusEn: "Version control and tracking code changes.",
  },
  {
    name: "Next.js",
    icon: "nextjs",
    color: "#34383d",
    category: "Web",
    focus: "Halaman web berbasis React dan routing.",
    focusEn: "React-based web pages and routing.",
  },
  {
    name: "Node.js",
    icon: "nodejs",
    color: "#287b34",
    category: "Backend",
    focus: "Menjalankan JavaScript dan TypeScript di sisi server.",
    focusEn: "Running JavaScript and TypeScript on the server.",
  },
  {
    name: "Express.js",
    icon: "express",
    color: "#565b64",
    category: "Backend",
    focus: "Routing HTTP dan dasar API aplikasi.",
    focusEn: "HTTP routing and application API fundamentals.",
  },
  {
    name: "C",
    icon: "c",
    color: "#3866ab",
    category: "Language",
    focus: "Dasar algoritma, struktur data, dan pemrograman prosedural.",
    focusEn: "Algorithms, data structures, and procedural programming.",
  },
  {
    name: "Android Studio",
    icon: "androidstudio",
    color: "#2c8150",
    category: "Tools",
    focus: "Lingkungan pengembangan dan debugging Android.",
    focusEn: "Android development and debugging environment.",
  },
];
