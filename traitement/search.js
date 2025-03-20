const fs = require('fs');
const path = require('path');
const Book = require('./book'); // Assuming Book.js is in the same directory
const { kmpMatch } = require('./KMP');

/**
 * Splits the pattern into keywords based on the search type.
 *
 * @param {string} pattern - The search pattern.
 * @param {string} type - The type of search ('keyword', 'regex', or 'kmp').
 * @returns {string[]} - Array of keywords.
 */
function splitPattern(pattern, type) {
    if (type === 'regex') {
        return [pattern]; // Return the entire pattern as a single keyword for regex search
    } else {
        return pattern.split(/[^\p{L}\p{Nd}]+/u);
    }
}

/**
 * Checks if an index word matches a keyword based on the search type.
 *
 * @param {string} indexWord - The word from the index.
 * @param {string} keyword - The keyword to match.
 * @param {string} type - The type of search ('keyword', 'regex', or 'kmp').
 * @returns {boolean} - True if the word matches the keyword.
 */
function isKeywordMatch(indexWord, keyword, type) {
    if (type === 'keyword') {
        return indexWord === keyword;
    } else {
        return indexWord.includes(keyword);
    }
}

/**
 * Searches for books matching the given pattern and type.
 *
 * @param {string} pattern - The search pattern.
 * @param {string} type - The type of search ('keyword', 'regex', or 'kmp').
 * @param {Book[]} metadata - List of book metadata.
 * @param {Object} wordsIndex - Object mapping words to book occurrences.
 * @param {Object} bookPaths - Object mapping book IDs to file paths.
 * @returns {Array<{ book: Book, occurrence: number }>} - List of matching books with occurrences.
 */
function searchDir(pattern, type, metadata, wordsIndex, bookPaths) {
    const keywords = splitPattern(pattern, type);

    // Handle regex search separately
    if (type === 'regex') {
        const regex = new RegExp(pattern, 'i');
        const matchedBooks = metadata
            .filter(book => {
                const bookPath = bookPaths[book.id];
                if (!bookPath) return false; // Skip if book path is not found
                const content = fs.readFileSync(`books/${bookPath}`, 'utf8');
                return regex.test(content);
            })
            .map(book => ({ book, occurrence: 1 })); // Set occurrence to 1 for regex matches
        console.log(`Searching ${matchedBooks.length} books`);
        return matchedBooks;
    }

    // For keyword and KMP search, proceed with the existing logic
    const bookMapsForKeywords = keywords.map(keyword => {
        const matchingBooks = new Map();

        // Iterate over the wordsIndex object
        Object.entries(wordsIndex).forEach(([indexWord, bookMap]) => {
            if (isKeywordMatch(indexWord, keyword.toLowerCase(), type)) {
                Object.entries(bookMap).forEach(([bookId, occ]) => {
                    const bookIdNum = parseInt(bookId, 10);
                    matchingBooks.set(bookIdNum, (matchingBooks.get(bookIdNum) || 0) + occ);
                });
            }
        });

        return matchingBooks;
    });

    // Intersect or union the book maps based on the pattern
    const booksWithTfIdfScore = bookMapsForKeywords.reduce((m1, m2) => {
        const result = new Map();

        if (!pattern.includes('|')) {
            // Intersection
            m1.forEach((occ1, bookId) => {
                if (m2.has(bookId)) {
                    result.set(bookId, occ1 + m2.get(bookId));
                }
            });
        } else {
            // Union
            const allBookIds = new Set([...m1.keys(), ...m2.keys()]);
            allBookIds.forEach(bookId => {
                result.set(bookId, (m1.get(bookId) || 0) + (m2.get(bookId) || 0));
            });
        }

        return result;
    });

    // Convert the map to a list of [bookId, occurrence] pairs
    const booksWithTfIdfScoreList = Array.from(booksWithTfIdfScore.entries());

    console.log(`Searching ${booksWithTfIdfScoreList.length} books`);

    // Handle keyword search
    if (type === 'keyword') {
        return booksWithTfIdfScoreList.map(([bookId, occ]) => {
            const book = metadata.find(b => b.id === bookId);
            return { book, occurrence: occ };
        });
    }

    // Handle KMP search
    if (type === 'kmp') {
        return booksWithTfIdfScoreList
            .filter(([bookId, occ]) => {
                const bookPath = bookPaths[bookId]; // Access book path using bracket notation
                if (!bookPath) return false; // Skip if book path is not found
                const content = fs.readFileSync(`books/${bookPath}`, 'utf8');
                return kmpMatch(pattern.toLowerCase(), content.toLowerCase()) !== -1;
            })
            .map(([bookId, occ]) => {
                const book = metadata.find(b => b.id === bookId);
                return { book, occurrence: occ };
            });
    }

    throw new Error(`Unsupported search type: ${type}`);
}

module.exports = searchDir;