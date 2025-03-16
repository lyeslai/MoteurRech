const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  subjects: { type: [String], default: [] },
  wordCount: { type: Number, required: true },
  contentPath: { type: String, required: true },
  coverUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Book", BookSchema);
