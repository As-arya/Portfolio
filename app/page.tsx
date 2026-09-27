import { Header, Hero, About, Contact, Footer } from "./sections";
import { Projects } from "./work";
import Technology from "./technology";
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
        <Technology />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
