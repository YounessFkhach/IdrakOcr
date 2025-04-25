import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

type LanguageContextType = {
  language: string;
  setLanguage: (language: string) => void;
  availableLanguages: { code: string; name: string }[];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [language, setLanguageState] = useState(i18n.language || "en");

  const availableLanguages = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" }
  ];

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("i18nextLng", lang);
    
    // Get language name for toast
    const langName = availableLanguages.find(l => l.code === lang)?.name || lang;
    
    toast({
      title: i18n.t("language.changed"),
      description: i18n.t("language.switchedTo", { language: langName }),
    });
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, availableLanguages }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
