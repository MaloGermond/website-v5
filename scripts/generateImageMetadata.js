#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Récupère le chemin du dossier depuis les arguments
const imagesDir = process.argv[2];
if (!imagesDir) {
  console.error(
    'Erreur : Veuillez spécifier le chemin du dossier en argument.'
  );
  console.log('Exemple : node generate-images-metadata.js ./public/images');
  process.exit(1);
}

// Fichier de sortie
const outputFile = path.join(imagesDir, '/images-metadata.json');

// Fonction pour obtenir le nom du fichier sans extension
const getFileNameWithoutExt = (file) => path.parse(file).name;

// Crée un objet vide pour stocker les métadonnées
const imagesStore = [];

// Lit le contenu du dossier
fs.readdirSync(imagesDir)
  .filter((file) => /\.(png|jpe?g)$/i.test(file)) // Filtre les fichiers PNG/JPEG
  .forEach((file) => {
    const fileName = getFileNameWithoutExt(file);
    imagesStore.push(fileName);
  });

// Lit le contenu de images-metadata.json s'il existe, sinon initialise un objet vide
let metadata = {};

if (fs.existsSync(outputFile)) {
  const fileContent = fs.readFileSync(outputFile, 'utf-8');
  if (fileContent) {
    metadata = JSON.parse(fileContent);
  }
}

// Met à jour les métadonnées : ajoute les nouvelles images si elles n'existent pas déjà
imagesStore.forEach((fileName) => {
  if (!metadata[fileName]) {
    console.info('Add new source: ', fileName);
    metadata[fileName] = {
      alt: {
        fr: '',
        en: '',
      },
    };
  }
});

// Écrit le résultat dans un fichier JSON
fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));

console.log(`✅ Fichier ${outputFile} généré avec succès !`);
