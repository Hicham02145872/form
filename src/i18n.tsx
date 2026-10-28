import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import translations from './translations.json';

type Language = 'fr' | 'ar';
const dictionary: Record<string, string> = translations;
const LanguageContext = createContext({ language: 'fr' as Language, setLanguage: (_: Language) => {}, t: (text: string) => text, locale: 'fr-FR' });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('campus-language') === 'ar' ? 'ar' : 'fr'; } catch { return 'fr'; }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.title = language === 'ar' ? 'إنصات الجامعة — صوتك مهم' : 'Campus Écoute — Votre voix compte';
    try { localStorage.setItem('campus-language', language); } catch { /* Storage may be disabled. */ }
  }, [language]);
  const t = (text: string) => language === 'ar' ? dictionary[text] ?? text : text;
  return <LanguageContext.Provider value={{ language, setLanguage, t, locale: language === 'ar' ? 'ar-MA' : 'fr-FR' }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-switcher" role="group" aria-label="Langue / اللغة" dir="ltr">
    <button type="button" lang="fr" aria-pressed={language === 'fr'} onClick={() => setLanguage('fr')}>Français</button>
    <button type="button" lang="ar" aria-pressed={language === 'ar'} onClick={() => setLanguage('ar')}>العربية</button>
  </div>;
}
