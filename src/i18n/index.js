import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import es from "./locales/es.json"
import en from "./locales/en.json"
import pt from "./locales/pt.json"
import fr from "./locales/fr.json"
import de from "./locales/de.json"
import it from "./locales/it.json"
import ja from "./locales/ja.json"
import zh from "./locales/zh.json"
import ar from "./locales/ar.json"
import ru from "./locales/ru.json"
import ko from "./locales/ko.json"
import nl from "./locales/nl.json"
import tr from "./locales/tr.json"

const savedLang = localStorage.getItem("stratega_lang") || "es"

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    ja: { translation: ja },
    zh: { translation: zh },
    ar: { translation: ar },
    ru: { translation: ru },
    ko: { translation: ko },
    nl: { translation: nl },
    tr: { translation: tr },
  },
  lng: savedLang,
  fallbackLng: "es",
  interpolation: { escapeValue: false },
})

export default i18n
