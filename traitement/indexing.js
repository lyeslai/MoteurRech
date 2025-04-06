/**
 * indexing.js:
 *
 * Cleaner text preprocessing inspired by your example.
 * Maintains TF-IDF while producing cleaner terms.
 */

const fs = require("fs");
const path = require("path");
const Book = require("./book");
const natural = require("natural");
const stemmer = natural.PorterStemmer;

class NodeIndex {
    constructor() {
        this.booksData = {}; // { bookId: { count, tfidf } }
        this.children = {}; // { character: NodeIndex }
    }

    printIndexRec(word = "", output = []) {
        if (Object.keys(this.booksData).length > 0) {
            if (word.length > 3 && word.length < 10) {
                output.push(`${word},${Object.entries(this.booksData)
                    .map(([bookId, data]) => `${bookId}:${data.tfidf.toFixed(6)}`)
                    .join("|")}`);
            }
        }
        for (const [char, node] of Object.entries(this.children)) {
            node.printIndexRec(word + char, output);
        }
        return output;
    }

    addOneOcc(bookId) {
        if (!this.booksData[bookId]) {
            this.booksData[bookId] = { count: 0, tfidf: 0 };
        }
        this.booksData[bookId].count++;
    }

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

    calculateTfIdf(totalBooks, docFrequency, bookTermCounts) {
        for (const [bookId, data] of Object.entries(this.booksData)) {
            if (bookTermCounts[bookId] === 0 || docFrequency === 0) {
                data.tfidf = 0;
                continue;
            }

            const tf = data.count / bookTermCounts[bookId];
            const idf = Math.log10(totalBooks / (docFrequency + 1));
            data.tfidf = tf * idf;
        }

        for (const child of Object.values(this.children)) {
            child.calculateTfIdf(totalBooks, docFrequency, bookTermCounts);
        }
    }
}

class Index {
    constructor() {
        this.root = new NodeIndex();
        this.totalBooks = 0;
        this.termDocumentFrequency = {};
        this.bookTermCounts = {};
    }

    isValidWord(word) {
        return /^[a-zA-Z]{5,10}$/.test(word) && word.length > 3;
    }

    preprocessText(content) {
        return content.toLowerCase()
            .split(/[^a-zA-Z]+/) // Split on any non-letter character
            .filter(word => this.isValidWord(word) && word.length > 3 && word.length < 10) // Apply strict word validation
            .map(word => ((word.length > 3 && word.length < 10) ? stemmer.stem(word) : null)) // Stem words with length > 3, otherwise ignore
            .filter(word => word !== null); // Remove ignored words
    }

    addContent(bookId, content) {
        if (!content) return;

        const words = this.preprocessText(content);
        const uniqueTerms = new Set(words.filter(word => word.length > 3 && word.length < 10));

        // Update book term count
        this.bookTermCounts[bookId] = (this.bookTermCounts[bookId] || 0) + words.length;

        // Add words to index
        for (const word of words) {
            this.root.addWord(bookId, word);
        }

        // Update document frequencies
        for (const term of uniqueTerms) {
            this.termDocumentFrequency[term] = (this.termDocumentFrequency[term] || 0) + 1;
        }

        this.totalBooks++;
    }

    finalizeIndex() {
        if (this.totalBooks === 0) this.totalBooks = 1;

        const stack = [{ node: this.root, term: '' }];

        while (stack.length > 0) {
            const { node, term } = stack.pop();

            if (Object.keys(node.booksData).length > 0) {
                const docFrequency = this.termDocumentFrequency[term] || 1;

                for (const [bookId, data] of Object.entries(node.booksData)) {
                    const totalTerms = this.bookTermCounts[bookId] || 1;
                    const tf = data.count / totalTerms;
                    const idf = Math.log10(this.totalBooks / (docFrequency));
                    data.tfidf = tf * idf;
                }
            }

            Object.entries(node.children)
                .forEach(([char, childNode]) => {
                    stack.push({ node: childNode, term: term + char });
                });
        }
    }

    printIndex(outputFile) {
        const output = this.root.printIndexRec();
        fs.writeFileSync(outputFile, output.join("\n"), "utf-8");
    }
}

async function indexLibrary(directory) {
    const bookFiles = fs.readdirSync(directory).filter(file => file.endsWith(".txt"));
    const index = new Index();
    const directoryMap = {};
    const totalBooks = bookFiles.length;
    let processedBooks = 0;

    console.log(`Found ${totalBooks} books to index.`);

    for (const file of bookFiles) {
        try {
            const book = Book.parse(path.join(directory, file));
            console.log(`Processing book number ${processedBooks + 1} with ID: ${book.id}...`);
            if (book.id != 0) {
                directoryMap[book.id] = file;
                index.addContent(book.id, book.content);
                processedBooks++;
            }
        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    }
    console.log(`Processed ${processedBooks} books, now passing to TF-IDF calculation...`);

    index.finalizeIndex();
    return { index, directoryMap };
}

async function main() {
    const libraryPath = "books";
    const outputFolder = "out";

    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

    try {
        const { index, directoryMap } = await indexLibrary(libraryPath);

        index.printIndex(path.join(outputFolder, "word_index.txt"));
        fs.writeFileSync(
            path.join(outputFolder, "book_paths.txt"),
            Object.entries(directoryMap)
                .map(([k, v]) => `${k},${v}`)
                .join("\n"),
            "utf-8"
        );

        console.log("✅ Indexing complete with clean terms and TF-IDF weights.");
    } catch (e) {
        console.error("Indexing failed:", e);
    }
}
module.exports = { indexLibrary };

// main().catch(console.error);