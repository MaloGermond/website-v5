// src/utils/translations.js
const projects = import.meta.glob('/src/locales/*.json', { eager: true });

export function getTranslation(lang, name) {
  const key = name
    ? '/src/locales/' + name + '_' + lang + '.json'
    : '/src/locales/' + lang + '.json';

  return projects[key];
}
