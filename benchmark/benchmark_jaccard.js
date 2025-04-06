const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const Book = require('../traitement/book');
const { jaccardMatrix } = require('../traitement/Jaccard');

const sizes = [1, 5, 10];
const results = [];

for (const size of sizes) {
  const files = fs.readdirSync('../books').filter(f => f.endsWith('.txt')).slice(0, size);
  const books = files.map(f => {
    const book = Book.parse(path.join('../books', f));
    return [book.id, book.wordsWithOccurrences()];
  });

  const bookIds = books.map(b => b[0]);
  const words = new Map(books.map(b => [b[0], b[1]]));

  const start = performance.now();
  jaccardMatrix(bookIds, words);
  const end = performance.now();

  results.push({ size, time: (end - start).toFixed(2) + ' ms' });
}

console.table(results);
