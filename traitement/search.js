const fs = require('fs');
const path = require('path');
const Book = require('./book'); // Assuming Book.js is in the same directory

/**
 * Splits the pattern into keywords based on the search type.
 *
 * @param {string} pattern - The search pattern.
 * @param {string} type - The type of search ('keyword', 'regex', or 'kmp').
 * @returns {string[]} - Array of keywords.
 */
function splitPattern(pattern, type) {
    if (type === 'regex') {
        return pattern.replace(/[(.*|)]/g, ' ').replace(/\s+/g, ' ').split(' ');
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

    // For each keyword, get all matching entries from the wordsIndex
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
    const booksWithOcc = bookMapsForKeywords.reduce((m1, m2) => {
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
    const booksWithOccList = Array.from(booksWithOcc.entries());

    console.log(`Searching ${booksWithOccList.length} books`);

    // Handle different search types
    if (type === 'keyword') {
        return booksWithOccList.map(([bookId, occ]) => {
            const book = metadata.find(b => b.id === bookId);
            return { book, occurrence: occ };
        });
    } else if (type === 'regex') {
        const regex = new RegExp(pattern, 'i');
        return booksWithOccList
            .filter(([bookId, occ]) => {
                const bookPath = bookPaths[bookId]; // Access book path using bracket notation
                if (!bookPath) return false; // Skip if book path is not found
                const content = fs.readFileSync(`books/${bookPath}`, 'utf8');
                return regex.test(content);
            })
            .map(([bookId, occ]) => {
                const book = metadata.find(b => b.id === bookId);
                return { book, occurrence: occ };
            });
    } else if (type === 'kmp') {
        // KMP search implementation (placeholder)
        return booksWithOccList
            .filter(([bookId, occ]) => {
                const bookPath = bookPaths[bookId]; // Access book path using bracket notation
                if (!bookPath) return false; // Skip if book path is not found
                const content = fs.readFileSync(`books/${bookPath}`, 'utf8');
                return content.includes(pattern); // Simple placeholder for KMP
            })
            .map(([bookId, occ]) => {
                const book = metadata.find(b => b.id === bookId);
                return { book, occurrence: occ };
            });
    } else {
        throw new Error(`Unsupported search type: ${type}`);
    }
}

module.exports = searchDir;