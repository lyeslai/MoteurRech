const express = require("express");
const fs = require("fs");
const path = require("path");
const Book = require("../models/Book");

const router = express.Router();

// Récupérer tous les livres
router.get("/", async (req, res) => {
  try {
    const books = await Book.find({});
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des livres" });
  }
});

// Recherche avancée avec KMP et RegEx
function buildLPS(pattern) {
  const lps = Array(pattern.length).fill(0);
  let len = 0, i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) len = lps[len - 1];
      else {
        lps[i] = 0;
        i++;
      }
    }
  }
  return lps;
}

function kmpSearch(text, pattern) {
  if (!pattern) return false;
  const lps = buildLPS(pattern);
  let i = 0, j = 0;
  while (i < text.length) {
    if (pattern[j] === text[i]) {
      i++, j++;
      if (j === pattern.length) return true;
    } else {
      if (j !== 0) j = lps[j - 1];
      else i++;
    }
  }
  return false;
}

router.get("/search", async (req, res) => {
    const { query, mode } = req.query;
    console.log("🔍 API Recherche reçue avec:", query, mode);
  
    if (!query) return res.status(400).json({ error: "Query is required" });
  
    try {
      const books = await Book.find({});
      console.log(`📚 ${books.length} livres trouvés en base`);
  
      let results = [];
  
      for (let book of books) {
        console.log(`📖 Vérification du livre: ${book.title}`);
  
        // Lire le fichier de contenu
        try {
          const content = fs.readFileSync(path.join(__dirname, "..", book.contentPath), "utf8");
          console.log(`✍️ Contenu du livre ${book.title} (100 premiers caractères) :`, content.substring(0, 100));
  
          if (mode === "regex") {
            const regex = new RegExp(query, "i");
            if (regex.test(content)) {
              console.log(`✅ Trouvé par RegEx: ${book.title}`);
              results.push(book);
            }
          } else {
            if (kmpSearch(content, query)) {
              console.log(`✅ Trouvé par KMP: ${book.title}`);
              results.push(book);
            }
          }
        } catch (err) {
          console.error(`❌ Erreur de lecture du fichier ${book.contentPath}:`, err);
        }
      }
  
      console.log("📊 Résultats API envoyés:", results.length);
      res.json(results);
    } catch (err) {
      console.error("❌ Erreur API:", err);
      res.status(500).json({ error: "Erreur lors de la recherche" });
    }
  });
router.get("/search", async (req, res) => {
  const { query, mode } = req.query;
  console.log("🔍 API Recherche reçue avec:", query, mode);

  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const books = await Book.find({});
    console.log(`📚 ${books.length} livres trouvés en base`);

    let results = [];

    for (let book of books) {
      console.log(`📖 Vérification du livre: ${book.title}`);

      // Lire le fichier de contenu
      try {
        const content = fs.readFileSync(path.join(__dirname, "..", book.contentPath), "utf8");
        console.log(`✍️ Contenu du livre ${book.title} (100 premiers caractères) :`, content.substring(0, 100));

        if (mode === "regex") {
          const regex = new RegExp(query, "i");
          if (regex.test(content)) {
            console.log(`✅ Trouvé par RegEx: ${book.title}`);
            results.push(book);
          }
        } else {
          if (kmpSearch(content, query)) {
            console.log(`✅ Trouvé par KMP: ${book.title}`);
            results.push(book);
          }
        }
      } catch (err) {
        console.error(`❌ Erreur de lecture du fichier ${book.contentPath}:`, err);
      }
    }

    console.log("📊 Résultats API envoyés:", results.length);
    res.json(results);
  } catch (err) {
    console.error("❌ Erreur API:", err);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});
  

module.exports = router;
