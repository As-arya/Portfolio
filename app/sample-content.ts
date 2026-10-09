import type { CertificateRecord, EducationRecord } from "../lib/models";

export const sampleEducation: EducationRecord[] = [
  {
    id: "sample-university", institution: "Universitas Contoh", startYear: 2023, endYear: null,
    logo: { publicId: "sample/education-university", url: "/education/sample-university.svg", altId: "Logo contoh universitas", altEn: "Sample university logo" },
    translations: {
      id: { courseworkTitle: "Mata Pelajaran / Mata Kuliah", program: "Computer Science · Software Engineering", description: "Data contoh untuk melihat tampilan pendidikan. Ganti nama universitas, tahun, dan materi ini dengan informasi pendidikan Anda melalui admin.", courses: [
        { title: "Algoritma & Struktur Data", description: "Pemecahan masalah, kompleksitas algoritma, dan penggunaan struktur data." },
        { title: "Software Engineering", description: "Analisis kebutuhan, perancangan aplikasi, pengujian, dan kerja sama dalam proyek." },
        { title: "Web & Mobile Development", description: "Membangun antarmuka, menghubungkan API, dan mengelola data aplikasi." },
      ] },
      en: { courseworkTitle: "Selected Coursework", program: "Computer Science · Software Engineering", description: "Sample content to preview the education layout. Replace the university, dates, and coursework with your own education through the admin.", courses: [
        { title: "Algorithms & Data Structures", description: "Problem solving, algorithm complexity, and practical data structures." },
        { title: "Software Engineering", description: "Requirements, application design, testing, and collaboration on projects." },
        { title: "Web & Mobile Development", description: "Building interfaces, connecting APIs, and managing application data." },
      ] },
    },
  },
  {
    id: "sample-school", institution: "SMA Contoh", startYear: 2020, endYear: 2023,
    logo: { publicId: "sample/education-school", url: "/education/sample-school.svg", altId: "Logo contoh sekolah", altEn: "Sample school logo" },
    translations: {
      id: { courseworkTitle: "Mata Pelajaran / Mata Kuliah", program: "Ilmu Pengetahuan Alam", description: "Contoh riwayat SMA yang sudah selesai. Bagian mata pelajaran bersifat opsional dan dapat dikosongkan.", courses: [] },
      en: { courseworkTitle: "Selected Coursework", program: "Natural Sciences", description: "A sample completed high-school entry. Coursework is optional and can be left empty.", courses: [] },
    },
  },
];

export const sampleCertificates: CertificateRecord[] = [
  {
    id: "sample-web", image: { publicId: "sample/certificate-web", url: "/certificates/sample-web.svg", altId: "Gambar contoh sertifikat Frontend Fundamentals", altEn: "Sample Frontend Fundamentals certificate" },
    translations: {
      id: { title: "Frontend Fundamentals (Contoh)", description: "Sertifikat contoh untuk menampilkan foto, judul, dan deskripsi. Materi contoh meliputi HTML, CSS, JavaScript, serta antarmuka yang responsif." },
      en: { title: "Frontend Fundamentals (Sample)", description: "A sample certificate to preview images, titles, and descriptions. Example topics include HTML, CSS, JavaScript, and responsive interfaces." },
    },
  },
  {
    id: "sample-mobile", image: { publicId: "sample/certificate-mobile", url: "/certificates/sample-mobile.svg", altId: "Gambar contoh sertifikat Mobile Development Workshop", altEn: "Sample Mobile Development Workshop certificate" },
    translations: {
      id: { title: "Mobile Development Workshop (Contoh)", description: "Contoh sertifikat workshop pengembangan aplikasi mobile. Anda dapat mengganti gambar ini dengan foto sertifikat sendiri dan menulis ringkasan materi yang dipelajari." },
      en: { title: "Mobile Development Workshop (Sample)", description: "A sample mobile-development workshop certificate. Replace this image with your own certificate and describe what you learned." },
    },
  },
];
