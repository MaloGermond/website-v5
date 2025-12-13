// src/utils/translations.js
import fr from '@locales/fr.json';
import en from '@locales/en.json';

export const translations = {
  fr,
  en,
};

export function getTranslation(lang) {
  return translations[lang];
}
