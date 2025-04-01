/**
 * indexing.js:
 *
 * Creates an index for words in books using a Trie.
 * Saves index results to files.
 */

const fs = require("fs");
const path = require("path");
const Book = require("./book");
const natural = require("natural");
const stemmer = natural.PorterStemmer;

class NodeIndex {
    constructor() {
        this.booksData = {}; // { bookId: count }
        this.children = {}; // { character: NodeIndex }
    }

    /**
     * Recursively prints the index with word counts
     */
    printIndexRec(word = "", output = []) {
        if (Object.keys(this.booksData).length > 0) {
            output.push(`${word},${Object.entries(this.booksData)
                .map(([bookId, count]) => `${bookId}:${count}`)
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
            this.booksData[bookId] = 0;
        }
        this.booksData[bookId]++;
    }

    /**
     * Adds a word to the Trie
     */
    addWord(bookId, word) {
        let node = this;
        for (const char of word) {
            if (!node.children[char]) {
                node.children[char] = new NodeIndex();
            }
            node = node.children[char];
        }
        node.addOneOcc(bookId);
    }
}

class Index {
    constructor() {
        this.root = new NodeIndex();
    }

    /**
     * Adds a word to the index
     */
    addWord(bookId, word) {
        this.root.addWord(bookId, word);
    }

    /**
     * Adds book content to the index
     */
    addContent(bookId, content) {
        // Tokenization: Remove numbers, punctuation, and split into words
        const words = content.toLowerCase().split(/[^a-zA-Z]+/).filter(Boolean);

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

    index.printIndex(path.join(outputFolder, "word_index.txt"));
    fs.writeFileSync(path.join(outputFolder, "book_paths.txt"), Object.entries(directoryMap)
        .map(([k, v]) => `${k},${v}`)
        .join("\n"), "utf-8");

    console.log("✅ Indexing complete with word counts.");
}
module.exports = { indexLibrary };
// main().catch(console.error);
