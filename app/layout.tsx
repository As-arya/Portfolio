import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./refinements.css";
import { Preferences } from "./preferences";

const sans = localFont({
  src: "./fonts/Manrope.ttf",
  variable: "--font-sans",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/IBMPlexMono-Regular.ttf",
  variable: "--font-mono",
  display: "swap",
  weight: "400",
});
export const metadata: Metadata = {
  title: "Asarya Jachred Alotia | Software Engineering Portfolio",
  description:
    "Portofolio Asarya Jachred Alotia, mahasiswa Computer Science BINUS University dengan peminatan Software Engineering.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{let t=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{}`,
          }}
        />
        <Preferences>{children}</Preferences>
      </body>
    </html>
  );
}
