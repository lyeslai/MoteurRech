const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const natural = require("natural");
const stopwords = require("stopword");
const Book = require("../models/Book");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const tokenizer = new natural.WordTokenizer();
const lemmatizer = new natural.WordNetLemmatizer(); // ✅ Ajout de la lemmatisation
const indexCollection = mongoose.connection.collection("index");

// ✅ Filtrage strict des mots
const isValidWord = (word) => /^[a-zA-Z]{4,}$/.test(word); // Exclut nombres, symboles, et mots courts

async function indexBooks() {
  console.log("🔍 Début de l'indexation...");
  const { deletedCount } = await indexCollection.deleteMany({});
  console.log(`🗑️ Suppression des anciens index : ${deletedCount} documents supprimés`);

  const books = await Book.find({});
  console.log(`📚 Nombre de livres trouvés : ${books.length}`);

  let batchUpdates = [];
  let wordIndex = {};

  for (let book of books) {
    try {
      const filePath = path.join(__dirname, "..", book.contentPath);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`);
        continue;
      }

      const stream = fs.createReadStream(filePath, { encoding: "utf8" });

      let wordCounts = {};

      for await (const chunk of stream) {
        let words = tokenizer.tokenize(chunk.toLowerCase());
        words = stopwords.removeStopwords(words); // ✅ Suppression des stopwords
        words = words.filter(isValidWord).map(lemmatizer.lemmatize); // ✅ Filtrage + Lemmatisation

        words.forEach((word) => {
          if (!wordCounts[word]) wordCounts[word] = 0;
          wordCounts[word] += 1;
        });
      }

      // ✅ Stocker les mots-clés en mémoire pour éviter les ralentissements
      for (const [word, count] of Object.entries(wordCounts)) {
        if (!wordIndex[word]) wordIndex[word] = {};
        wordIndex[word][book._id] = count;
      }

      console.log(`✅ Livre indexé : ${book.title} (${Object.keys(wordCounts).length} mots uniques)`);

      // ✅ Insérer en bulk après 5000 mots stockés en mémoire
      if (Object.keys(wordIndex).length > 5000) {
        await insertBatch(wordIndex);
        wordIndex = {};
      }

    } catch (err) {
      console.error(`❌ Erreur sur ${book.title}:`, err);
    }
  }

  // ✅ Dernier batch à insérer
  if (Object.keys(wordIndex).length > 0) {
    await insertBatch(wordIndex);
  }

  console.log(`✅ Indexation terminée ! ${await indexCollection.countDocuments()} mots indexés.`);
  mongoose.connection.close();
}

// ✅ Insertion optimisée en MongoDB avec `bulkWrite`
async function insertBatch(wordIndex) {
  const bulkOps = Object.entries(wordIndex).map(([word, books]) => ({
    updateOne: {
      filter: { word },
      update: { $set: { books } },
      upsert: true, // ✅ Ajoute si ça n'existe pas
    },
  }));

  await indexCollection.bulkWrite(bulkOps);
  console.log(`📤 Batch de ${bulkOps.length} mots inséré dans MongoDB !`);
}

// 🚀 Lancer l'indexation
// indexBooks().catch((err) => console.error("❌ Erreur:", err));
