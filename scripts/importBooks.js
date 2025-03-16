require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const natural = require('natural');

// Connexion à MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connecté à MongoDB Atlas'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  coverUrl: String,
  content: String,
  wordIndex: Object,
  wordCount: Number,
});

const Book = mongoose.model('Book', bookSchema);

// Fonction pour ralentir les requêtes et éviter le "socket hang up"
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importBooks() {
  let count = 0;
  let page = 1;

  try {
    while (count < 1000) {
      console.log(`🔍 Récupération des livres - Page ${page}...`);
      let response;

      try {
        response = await axios.get(`https://gutendex.com/books/?page=${page}`, { timeout: 10000 });
      } catch (error) {
        console.error(`⚠️ Erreur de récupération API (Page ${page}):`, error.message);
        await delay(5000); // Pause de 5s avant de réessayer
        continue;
      }

      const books = response.data.results;

      for (let book of books) {
        if (count >= 1000) break;
        if (!book.formats["text/plain"]) continue;

        let textResponse;
        try {
          textResponse = await axios.get(book.formats["text/plain"], { timeout: 15000 });
        } catch (error) {
          console.error(`⚠️ Erreur de téléchargement du livre: ${book.title} -`, error.message);
          await delay(3000);
          continue;
        }

        const content = textResponse.data;
        const tokenizer = new natural.WordTokenizer();
        const words = tokenizer.tokenize(content.toLowerCase());

        if (words.length < 10000) {
          console.log(`⏩ Livre ignoré (moins de 10 000 mots) : ${book.title}`);
          continue;
        }

        const wordIndex = {};
        words.forEach((word, idx) => {
          if (!wordIndex[word]) wordIndex[word] = [];
          wordIndex[word].push(idx);
        });

        const author = book.authors && book.authors.length > 0 ? book.authors.map(a => a.name).join(", ") : "Inconnu";
        const coverUrl = book.formats["image/jpeg"] || "";

        const newBook = new Book({
          title: book.title,
          author,
          coverUrl,
          content,
          wordIndex,
          wordCount: words.length
        });
        await newBook.save();
        count++;
        console.log(`📚 Livre importé : ${book.title} - Auteur(s): ${author} (${count}/1000)`);
      }
      page++;
      await delay(2000); // Pause de 2s entre les pages
    }

    console.log('✅ Importation terminée avec succès');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erreur critique lors de limportation', error.message);
    mongoose.connection.close();
  }
}

importBooks();
