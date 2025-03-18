const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const natural = require("natural");
const stopword = require("stopword");
require("dotenv").config();

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch(err => console.error("❌ Erreur de connexion à MongoDB:", err));

// Définition des modèles Mongoose
const Book = mongoose.model("Book", new mongoose.Schema({
  gutendex_id: Number,
  contentPath: String
}, { collection: "books" })); // Collection "books"

const tokenizer = new natural.WordTokenizer();
const lemmatizer = natural.PorterStemmer;
const indexCollection = mongoose.connection.collection("index");

const BOOKS_DIR = path.join(__dirname, "../books");
const BATCH_SIZE = 5000;

// 🔹 Récupérer les livres déjà indexés
async function getIndexedBooks() {
  const indexedDocs = await indexCollection.find({}, { projection: { books: 1 } }).toArray();
  const indexedBooks = new Set();

  indexedDocs.forEach(doc => {
    Object.keys(doc.books).forEach(bookId => indexedBooks.add(bookId));
  });

  return indexedBooks;
}

// Vérification avancée d'un mot
const isValidWord = (word) => {
  return (
    word.length > 3 &&
    /^[a-zA-Z]+$/.test(word) &&
    stopword.removeStopwords([word]).length !== 0
  );
};

async function indexBooks() {
  console.log("🔍 Début de l'indexation...");

  const books = await Book.find({}).lean().exec();
  const bookMap = {}; 
  books.forEach(book => {
    const normalizedPath = path.basename(book.contentPath); // 🔥 Extrait juste "book_XXXX.txt"
    bookMap[normalizedPath] = book.gutendexId; // 🔹 Utilise gutendexId au lieu de gutendex_id
  });
  
  console.log("📌 Vérification des fichiers trouvés dans MongoDB:", Object.keys(bookMap).slice(0, 10)); // 🔍 Log pour test
  

  const indexedBooks = await getIndexedBooks();
  console.log(`📌 ${indexedBooks.size} livres déjà indexés, on reprend à partir du dernier.`);

  let batch = [];

  for (let bookFile of fs.readdirSync(BOOKS_DIR).filter(file => file.endsWith(".txt"))) {
    const bookId = bookMap[bookFile];

    if (!bookId) {
      console.warn(`⚠️ Aucun gutendex_id trouvé pour ${bookFile}`);
      continue;
    }

    if (indexedBooks.has(bookId.toString())) {
      console.log(`🔄 Livre déjà indexé, on passe : ${bookFile}`);
      continue;
    }

    const filePath = path.join(BOOKS_DIR, bookFile);

    try {
      console.log(`📖 Traitement du livre : ${bookFile} (ID: ${bookId})`);

      const wordCounts = {};
      const stream = fs.createReadStream(filePath, { encoding: "utf8" });

      for await (const chunk of stream) {
        let words = tokenizer.tokenize(chunk.toLowerCase());
        words = words.filter(isValidWord).map(word => lemmatizer.stem(word));

        words.forEach((word) => {
          if (!wordCounts[word]) wordCounts[word] = 0;
          wordCounts[word] += 1;
        });
      }

      Object.entries(wordCounts).forEach(([word, count]) => {
        if (count >= 10) {
          batch.push({
            updateOne: {
              filter: { word },
              update: { $set: { [`books.${bookId}`]: count } },
              upsert: true
            }
          });
        }
      });

      console.log(`✅ Livre indexé : ${bookFile} (${Object.keys(wordCounts).length} mots uniques)`);

      if (batch.length >= BATCH_SIZE) {
        await indexCollection.bulkWrite(batch, { ordered: false });
        console.log("📤 Batch inséré dans MongoDB !");
        batch = [];
      }

      // Permet d'éviter de bloquer l'event loop (utile pour un très gros dataset)
      await new Promise(resolve => setTimeout(resolve, 0));
      
    } catch (err) {
      console.error(`❌ Erreur sur ${bookFile}:`, err);
    }
  }

  if (batch.length > 0) {
    await indexCollection.bulkWrite(batch, { ordered: false });
    console.log("📤 Dernier batch inséré !");
  }

  const indexedCount = await indexCollection.countDocuments();
  console.log(`✅ Indexation terminée ! ${indexedCount} mots indexés.`);
  mongoose.connection.close();
}

// Lancer l'indexation
indexBooks().catch((err) => console.error("❌ Erreur:", err));
