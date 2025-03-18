const mongoose = require("mongoose");
const Book = require("../models/Book");
const Similarity = require("../models/similarity");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Connecté à MongoDB"))
    .catch(err => console.error("❌ Erreur de connexion MongoDB:", err));

async function computeJaccard() {
    console.log("🔍 Calcul des similarités Jaccard...");

    const books = await Book.find({}).lean().exec();
    const indexCollection = mongoose.connection.collection("index");

    let similarities = [];

    for (let i = 0; i < books.length; i++) {
        for (let j = i + 1; j < books.length; j++) {
            const bookA = books[i].gutendexId;
            const bookB = books[j].gutendexId;

            const wordsA = await indexCollection.find({ [`books.${bookA}`]: { $exists: true } }).toArray();
            const wordsB = await indexCollection.find({ [`books.${bookB}`]: { $exists: true } }).toArray();

            const setA = new Set(wordsA.map(w => w.word));
            const setB = new Set(wordsB.map(w => w.word));

            const intersection = new Set([...setA].filter(word => setB.has(word)));
            const union = new Set([...setA, ...setB]);

            const jaccard = intersection.size / union.size;

            if (jaccard > 0.05) {  // Seuil pour éviter les faibles scores inutiles
                similarities.push({ bookA, bookB, similarity: jaccard });
            }

            if (similarities.length >= 1000) {
                await Similarity.insertMany(similarities);
                similarities = [];
            }
        }
    }

    if (similarities.length > 0) {
        await Similarity.insertMany(similarities);
    }

    console.log("✅ Calcul terminé !");
    mongoose.connection.close();
}

computeJaccard().catch(err => console.error("❌ Erreur:", err));
