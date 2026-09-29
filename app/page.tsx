import { Header, Hero, About, Contact, Footer } from "./sections";
import { Projects } from "./work";
import Technology from "./technology";
import { getAvailability, getPublishedProjects } from "../lib/repository";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [projects, availability] = await Promise.all([getPublishedProjects(), getAvailability()]);
  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Header />
      <main>
        <Hero availability={availability} />
        <About />
        <Technology />
        <Projects projects={projects} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
