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
    relevance: (BookData.centrality.find(([idCent, _]) => idCent === parseInt(book.id, 10)) || [0, 0])[1],
    occurrence: occurrence,
});

// Get list of books with pagination
router.get("/books", (req, res) => {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 9; // default to 9 items per page

    const books = BookData.metadata
        .filter((book) => book.id != -1) // filter out invalid books
        .map((book) => bookJson(book, 0));

    // Get the subset of books based on page and limit
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedBooks = books.slice(startIndex, endIndex);

    res.json({
        books: paginatedBooks,
        totalBooks: books.length, // total number of books for pagination info
    });
});


// Get content of a specific book
router.get("/book/:bookId", (req, res) => {
    const bookId = parseInt(req.params.bookId, 10);
    let filePath = BookData.bookPaths[bookId];
    const cleanFilePath = filePath.replace(/[\r\n\t]/g, '').trim();

    console.log(`Checking file: ${filePath}`);
    const fileExists = filePath && fs.existsSync(path.join('books', cleanFilePath));
    console.log(`File exists? ${fileExists}`);

    const bookDetails = BookData.metadata.find((b) => b.id === bookId);

    if (bookDetails) {
        res.json({
            id: bookId,
            title: bookDetails.title,
            author: bookDetails.author,
            releaseDate: bookDetails.releaseDate,
            content: fileExists ? parse(path.join('books', filePath)).content : "Not found",
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
            centrality: (BookData.centrality.find(([idCent, _]) => idCent === parseInt(id, 10)) || [0, 0])[1],
        }))
        .sort((a, b) => a.distance - b.distance || b.centrality - a.centrality) // Sort by distance and centrality
        .slice(0, 6) // Take the top 6 recommendations
        .filter(rec => rec.distance > 0.0) // Filter out the book itself
        .map(rec => BookData.metadata.find(b => b.id === rec.id)); // Map to book metadata

    res.json(recommendations);
});

module.exports = router;
