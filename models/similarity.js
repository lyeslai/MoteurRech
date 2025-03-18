const mongoose = require("mongoose");

const similaritySchema = new mongoose.Schema({
    bookA: Number,   // gutendexId du premier livre
    bookB: Number,   // gutendexId du second livre
    similarity: Number // score jaccard
});

module.exports = mongoose.model("Similarity", similaritySchema);
