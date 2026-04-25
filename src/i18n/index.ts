import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources, RTL_CODES, SUPPORTED_CODES, type LanguageCode } from "./translations";

const STORAGE_KEY = "smokefree:lang";

function detectInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && SUPPORTED_CODES.includes(saved)) return saved;
  } catch {
    // ignore
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : "en";
  const base = nav.toLowerCase().split("-")[0] as LanguageCode;
  return SUPPORTED_CODES.includes(base) ? base : "en";
}

export function applyDirection(lang: string) {
  if (typeof document === "undefined") return;
  const isRtl = RTL_CODES.includes(lang as LanguageCode);
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function setLanguage(lang: LanguageCode) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  applyDirection(lang);
}

if (!i18n.isInitialized) {
  const initial = detectInitialLanguage();
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initial,
      fallbackLng: "en",
      supportedLngs: SUPPORTED_CODES,
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  applyDirection(initial);
}

export default i18n;
export { LANGUAGES, type LanguageCode } from "./translations";
