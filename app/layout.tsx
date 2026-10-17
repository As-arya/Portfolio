import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import "./refinements.css";
import { Preferences } from "./preferences";

const sans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Asarya Alotia Portfolio",
  description:
    "Portfolio of Asarya Jachred Alotia, a Computer Science student at BINUS University specializing in Software Engineering.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={sans.variable}>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{let t=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch{}`,
          }}
        />
        <Preferences>{children}</Preferences>
      </body>
    </html>
  );
}
