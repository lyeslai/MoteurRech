const express = require("express");
const router = express.Router();
const Similarity = require("../models/similarity");

// 🔹 Récupérer les livres similaires à un livre donné
router.get("/:bookId", async (req, res) => {
    try {
        const bookId = parseInt(req.params.bookId);

        const similarBooks = await Similarity.find({
            $or: [{ bookA: bookId }, { bookB: bookId }]
        }).sort({ similarity: -1 }).limit(10);

        res.json(similarBooks);
    } catch (error) {
        console.error("❌ Erreur API:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
