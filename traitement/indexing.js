/**
 * indexing.js:

    Creates an index for words in books.
    Uses a Trie (similar to NodeIndex in Scala).
    Stores word occurrences per book.
    Saves index results to files.
 */

const fs = require("fs");
const path = require("path");
const Book = require("./book");

class NodeIndex {
    constructor() {
        this.booksToOcc = {}; // { bookId: occurrences }
        this.children = {}; // { character: NodeIndex }
    }

    printIndexRec(word = "", output = []) {
        if (Object.keys(this.booksToOcc).length > 0) {
            output.push(`${word},${Object.entries(this.booksToOcc).map(([k, v]) => `${k}:${v}`).join("|")}`);
        }
        for (const [char, node] of Object.entries(this.children)) {
            node.printIndexRec(word + char, output);
        }
        return output;
    }

    addOneOcc(bookId) {
        this.booksToOcc[bookId] = (this.booksToOcc[bookId] || 0) + 1;
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
}

class Index {
    constructor() {
        this.root = new NodeIndex();
    }

    addWord(bookId, word) {
        this.root.addWord(bookId, word);
    }

    addContent(bookId, content) {
        const words = content.toLowerCase().split(/\W+/).filter(Boolean);
        for (const word of words) {
            this.addWord(bookId, word);
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
    fs.writeFileSync(path.join(outputFolder, "book_paths.txt"), Object.entries(directoryMap).map(([k, v]) => `${k},${v}`).join("\n"), "utf-8");

    console.log("✅ Indexing complete.");
}

main().catch(console.error);
