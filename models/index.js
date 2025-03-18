const mongoose = require("mongoose");

const IndexSchema = new mongoose.Schema({
    word: { type: String, required: true, unique: true },
    books: { type: Map, of: Number } // Stocke les occurrences par livre
});

module.exports = mongoose.model("Index", IndexSchema);
