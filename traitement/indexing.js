/**
 * indexing.js:
 *
 * Creates an index for words in books using a Trie.
 * Computes normalized TF-IDF scores such that the sum for each word equals 1.
 * Saves index results to files.
 */

const fs = require("fs");
const path = require("path");
const Book = require("./book");
const natural = require("natural");
const stemmer = natural.PorterStemmer;

class NodeIndex {
    constructor() {
        this.booksData = {}; // { bookId: { count, tfidf: 0 } }
        this.children = {}; // { character: NodeIndex }
        this.indexedBooks = new Set(); // Set of books that contain the word
    }

    /**
     * Recursively prints the index with normalized TF-IDF scores
     */
    printIndexRec(word = "", output = []) {
        if (Object.keys(this.booksData).length > 0) {
            output.push(`${word},${Object.entries(this.booksData)
                .map(([bookId, data]) => `${bookId}:${data.tfidf.toFixed(10)}`)
                .join("|")}`);
        }
        for (const [char, node] of Object.entries(this.children)) {
            node.printIndexRec(word + char, output);
        }
        return output;
    }

    /**
     * Adds an occurrence of a word in a book
     */
    addOneOcc(bookId) {
        if (!this.booksData[bookId]) {
            this.booksData[bookId] = { count: 0, tfidf: 0 };
            this.indexedBooks.add(bookId);
        }
        this.booksData[bookId].count++;
    }

    /**
     * Adds a word to the Trie
     */
    addWord(bookId, word, totalWordsInBook) {
        let node = this;
        for (const char of word) {
            if (!node.children[char]) {
                node.children[char] = new NodeIndex();
            }
            node = node.children[char];
        }
        node.addOneOcc(bookId);
        node.updateTFIDF(totalWordsInBook);
    }

    /**
     * Updates TF-IDF dynamically and normalizes it so that the sum is 1
     */
    updateTFIDF(totalWordsInBook) {
        // Step 1: Compute raw TF-IDF scores
        let rawTFIDF = {};

        // Number of books containing the word
        const docCount = this.indexedBooks.size;

        // Compute raw TF-IDF for each book
        let totalTFIDF = 0;
        for (const bookId in this.booksData) {
            const bookData = this.booksData[bookId];

            // Compute Term Frequency (TF)
            const tf = bookData.count / totalWordsInBook;

            // Compute Inverse Document Frequency (IDF)
            const idf = Math.log((docCount + 1) / (Object.keys(this.booksData).length + 1)) + 1; // Smoothed IDF

            // Compute raw TF-IDF
            rawTFIDF[bookId] = tf * idf;
            totalTFIDF += rawTFIDF[bookId]; // Sum up for normalization
        }

        // Step 2: Normalize TF-IDF scores
        for (const bookId in rawTFIDF) {
            this.booksData[bookId].tfidf = rawTFIDF[bookId] / totalTFIDF;
        }
    }
}

class Index {
    constructor() {
        this.root = new NodeIndex();
        this.bookWordCounts = {}; // { bookId: totalWordCount }
    }

    /**
     * Adds a word to the index and updates TF-IDF
     */
    addWord(bookId, word) {
        const totalWordsInBook = this.bookWordCounts[bookId] || 1;
        this.root.addWord(bookId, word, totalWordsInBook);
    }

    /**
     * Adds book content to the index
     */
    addContent(bookId, content) {
        // Tokenization: Remove numbers, punctuation, and split into words
        const words = content.toLowerCase().split(/[^a-zA-Z]+/).filter(Boolean);
        this.bookWordCounts[bookId] = words.length;

        for (const word of words) {
            const stemmedWord = stemmer.stem(word); // Apply stemming
            this.addWord(bookId, stemmedWord);
        }
    }

    /**
     * Prints the index to a file
     */
    printIndex(outputFile) {
        const output = this.root.printIndexRec();
        fs.writeFileSync(outputFile, output.join("\n"), "utf-8");
    }
}

async function indexLibrary(directory) {
    const bookFiles = fs.readdirSync(directory).filter(file => file.endsWith(".txt"));
    const index = new Index();
    const directoryMap = {};

    for (const file of bookFiles) {
        const book = await Book.parse(path.join(directory, file));
        console.log(`Processing ${book.id}...`);
        directoryMap[book.id] = file;
        index.addContent(book.id, book.content);
    }

    return { index, directoryMap };
}

async function main() {
    const libraryPath = "books";
    const outputFolder = "out";

    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

    const { index, directoryMap } = await indexLibrary(libraryPath);

    fs.writeFileSync(path.join(outputFolder, "word_index.txt"), index.root.printIndexRec().join("\n"), "utf-8");
    fs.writeFileSync(path.join(outputFolder, "book_paths.txt"), Object.entries(directoryMap)
        .map(([k, v]) => `${k},${v}`)
        .join("\n"), "utf-8");

    console.log("✅ Indexing complete with normalized TF-IDF.");
}

main().catch(console.error);
