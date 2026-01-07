// utils/useScreens.js (ou un fichier dédié dans ton projet)
let cachedImages = null;

export async function loadScreensOnce(loadScreens, metadata) {
  if (cachedImages) return cachedImages;

  const images = {};

  const promises = Object.entries(loadScreens).map(async ([path, importFn]) => {
    const screen = await importFn();
    const fileName = path.split('/').pop();
    const name = fileName.replace(/\.\w+$/, '');
    // console.log(metadata[name]);
    // console.log({ name });
    images[name] = {
      src: screen.default.src,
      width: screen.default.width,
      height: screen.default.height,
      format: screen.default.format,
      name: name,
      metadata: metadata[name],
    };
  });

  await Promise.all(promises);
  cachedImages = images; // Met en cache
  return images;
}
