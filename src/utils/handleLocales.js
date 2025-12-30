// src/utils/translations.js
const projects = import.meta.glob('/src/locales/*.json', { eager: true });
const loc = import.meta.glob('../locales/*.json', { eager: true });
console.log({ projects });
console.log({ loc });

export function getTranslation(lang, name) {
  const key = name
    ? '/src/locales/' + name + '_' + lang + '.json'
    : '/src/locales/' + lang + '.json';

  return projects[key];
}
