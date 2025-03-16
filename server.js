require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const booksRoutes = require("./routes/books");

const app = express();
app.use(express.json());
app.use(cors());

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB connecté");

  // Vérifier la base de données connectée
  console.log(`📂 Base de données utilisée : ${mongoose.connection.name}`);

  // Vérifier les collections disponibles
  mongoose.connection.db.listCollections().toArray()
    .then(collections => {
      console.log("📂 Collections disponibles :", collections.map(c => c.name));
    })
    .catch(err => console.error("❌ Erreur lors de la récupération des collections :", err));
}).catch(err => console.error("❌ Erreur MongoDB :", err));

app.use("/api/books", booksRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
