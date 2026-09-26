import { Header, Hero, About, Contact, Footer } from "./sections";
import { TechStack, Projects } from "./work";
export default function Page() {
  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Header />
      <main>
        <Hero />
        <About />
        <TechStack />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
