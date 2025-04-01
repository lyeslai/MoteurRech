const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { indexLibrary } = require('../traitement/indexing');

const sizes = [1, 5, 10];
const results = [];

(async () => {
  for (const size of sizes) {
    const dir = '../books';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).slice(0, size);

    // Créer un dossier temporaire
    const tempDir = `books_${size}`;
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    for (const file of files) {
      fs.copyFileSync(path.join(dir, file), path.join(tempDir, file));
    }

    const start = performance.now();
    await indexLibrary(tempDir);
    const end = performance.now();

    results.push({ size, time: (end - start).toFixed(2) + ' ms' });

    // Nettoyage
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.table(results);
})();
