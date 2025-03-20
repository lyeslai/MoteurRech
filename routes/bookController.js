const fs = require("fs");
const path = require("path");
const express = require("express");
const searchDir = require('../traitement/search'); // Import the searchDir function
const { parse } = require("../traitement/book");
const { parseMetadata, parseIndex, parseBookPaths } = require("../traitement/parseIndex");
const { parseCentrality, parseMatrix } = require("../traitement/Jaccard")

const router = express.Router();

// Lazy load book data (equivalent to Scala's lazy vals)
let BookData = {};

(async () => {
    BookData = {
        metadata: await parseMetadata(),
        wordsIndex: await parseIndex(),
        bookPaths: await parseBookPaths(),
        centrality: await parseCentrality(),
        jaccardMatrix: await parseMatrix(),
    };
})();


// Function to create book JSON response
const bookJson = (book, occurrence = 0) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    releaseDate: book.releaseDate,
    relevance: BookData.centrality[book.id] || 0,
    occurrence: occurrence,
});

// Get list of books
router.get("/books", (req, res) => {
    const books = BookData.metadata.map((book) => bookJson(book, 0));
    res.json(books);
});

// Get content of a specific book
router.get("/book/:bookId", (req, res) => {
    const bookId = parseInt(req.params.bookId, 10);
    const filePath = BookData.bookPaths[bookId];

    console.log(`Checking file: ${filePath}`);
    const fileExists = filePath && fs.existsSync(filePath);
    console.log(`File exists? ${fileExists}`);

    const bookDetails = BookData.metadata.find((b) => b.id === bookId);

    if (bookDetails) {
        res.json({
            id: bookId,
            title: bookDetails.title,
            author: bookDetails.author,
            releaseDate: bookDetails.releaseDate,
            content: fileExists ? parse(filePath).content : "Not found",
        });
    } else {
        res.json({
            id: bookId,
            title: "Unknown Title",
            author: "Unknown Author",
            releaseDate: "Unknown Date",
            content: "Not found",
        });
    }
});

// Search books by pattern
router.post("/search-books", (req, res) => {
    const { pattern, type } = req.body;

    if (!pattern || !type) {
        return res.status(400).json({ error: "Pattern and type are required." });
    }

    const matchedBooks = searchDir(pattern, type, BookData.metadata, BookData.wordsIndex, BookData.bookPaths);
    if (matchedBooks.length === 0) {
        return res.status(404).json({ error: "No books found." });
    }

    res.json(matchedBooks.map(({ book, occurrence }) => bookJson(book, occurrence)));
});

/**
 * Gets five random books.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/random-books', (req, res) => {
    if (BookData.metadata.length > 0) {
        const randomBooks = BookData.metadata
            .sort(() => Math.random() - 0.5) // Shuffle the array
            .slice(0, 5); // Take the first 5 books
        res.json(randomBooks);
    } else {
        res.status(404).json({ error: 'Aucun livre trouvé' });
    }
});

/**
 * Gets recommendations for a specific book.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
router.get('/recommendations/:bookId', (req, res) => {
    const bookId = parseInt(req.params.bookId, 10);

    if (!BookData.jaccardMatrix[bookId]) {
        return res.status(404).json({ error: 'Livre non trouvé' });
    }

    const recommendations = Object.entries(BookData.jaccardMatrix[bookId])
        .map(([id, distance]) => ({
            id: parseInt(id, 10),
            distance,
            centrality: BookData.centrality[id] || 0,
        }))
        .sort((a, b) => a.distance - b.distance || b.centrality - a.centrality) // Sort by distance and centrality
        .slice(0, 6) // Take the top 6 recommendations
        .filter(rec => rec.distance > 0.0) // Filter out the book itself
        .map(rec => BookData.metadata.find(b => b.id === rec.id)); // Map to book metadata

    res.json(recommendations);
});

module.exports = router;
