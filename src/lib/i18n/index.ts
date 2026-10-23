import i18n, { type ParseKeys } from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import { en } from "./locales/en"
import { vi, type Translation } from "./locales/vi"

export const languages = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
] as const

export type Language = (typeof languages)[number]["code"]

/** Any valid key, e.g. "nav.users". Use it to type keys stored outside components (menus, configs). */
export type TranslationKey = ParseKeys

declare module "i18next" {
  interface CustomTypeOptions {
    // Makes t("...") autocomplete and rejects unknown keys at compile time.
    resources: { translation: Translation }
  }
}

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { vi: { translation: vi }, en: { translation: en } },
    supportedLngs: languages.map((language) => language.code),
    fallbackLng: "vi",
    // Saved choice first, then the browser language.
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
    interpolation: { escapeValue: false }, // React already escapes.
  })

export { i18n }
