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
}).then(() => console.log("MongoDB connecté"))
  .catch(err => console.error("Erreur MongoDB:", err));

app.use("/api/books", booksRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
