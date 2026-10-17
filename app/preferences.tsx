"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Language = "id" | "en";
const Context = createContext({
  lang: "en" as Language,
  setLang: (_: Language) => {},
});
export function Preferences({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  useEffect(() => {
    try {
      if (localStorage.getItem("portfolio-language") === "id") setLang("id");
    } catch {}
  }, []);
  function changeLang(value: Language) {
    setLang(value);
    try {
      localStorage.setItem("portfolio-language", value);
    } catch {}
  }
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <Context.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </Context.Provider>
  );
}
export function useCopy() {
  const context = useContext(Context);
  return {
    ...context,
    t: (id: string, en: string) => (context.lang === "id" ? id : en),
  };
}
