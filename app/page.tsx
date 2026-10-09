import { Header, About, Contact, Footer } from "./sections";
import { Projects } from "./work";
import Technology from "./technology";
import Education from "./education";
import Certificates from "./certificates/certificates";
import { getAvailability, getCertificates, getEducation, getPublishedProjects } from "../lib/repository";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [projects, availability, education, certificates] = await Promise.all([getPublishedProjects(), getAvailability(), getEducation(), getCertificates()]);
  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Header />
      <main>
        <About availability={availability} />
        <Education entries={education} />
        <Technology />
        <Projects projects={projects} />
        <Certificates entries={certificates} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
