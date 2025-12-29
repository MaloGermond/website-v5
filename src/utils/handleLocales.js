// src/utils/translations.js
const projects = import.meta.glob('../locales/*.json', { eager: true });

export function getTranslation(lang, name) {
  const key = name
    ? '../locales/' + name + '_' + lang + '.json'
    : '../locales/' + lang + '.json';
  return projects[key] || {};
}
