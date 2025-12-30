// src/utils/translations.js
const locales = import.meta.glob('/src/locales/*.json', { eager: true });

export function getTranslation(lang, name) {
  console.log('get translation');
  console.log({ locales }, { lang }, { name });
  const key = name
    ? '/src/locales/' + name + '_' + lang + '.json'
    : '/src/locales/' + lang + '.json';

  return locales[key];
}
