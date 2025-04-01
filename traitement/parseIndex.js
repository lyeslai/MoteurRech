const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Book = require("./book");

// Parse the word index file
async function parseIndex() {
    const filePath = "out/word_index.txt";
    const index = {};

    try {
        const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
        for (const line of lines) {
            const [word, rest] = line.split(",");
            if (!word || !rest) continue;
            const occurrences = Object.fromEntries(
                rest.split("|").map(entry => {
                    const [bookId, count] = entry.split(":").map(Number);
                    return [bookId, count];
                })
            );
            index[word] = occurrences;
        }
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
    }

    return index;
}

// Parse book paths
async function parseBookPaths() {
    const filePath = "out/book_paths.txt";
    const books = {};

    try {
        const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
        for (const line of lines) {
            const [bookId, bookPath] = line.split(",");
            books[Number(bookId)] = bookPath;
        }
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
    }

    return books;
}

// Parse book metadata
async function parseMetadata() {
    const filePath = "traitement/books.csv";
    const books = [];

    try {
        const lines = fs.readFileSync(filePath, "utf-8").split("\n").slice(1); // Skip header
        for (const line of lines) {
            const cols = line.split("\",\"").map(col => col.replace(/^\"|\"$/g, "")); // Remove surrounding quotes

            if (cols.length < 4) continue; // Skip invalid rows

            books.push({
                id: Number(cols[0]) || -1,
                title: cols[1] || "Titre inconnu",
                author: cols[2] || "Auteur inconnu",
                releaseDate: cols[3] || "Date inconnue",
                extra: cols[4] || "",
            });
        }
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
    }

    return books;
}

// CLI Test Function (Similar to Scala's `@main def ParseIndex()`)
function parseIndexCLI() {
    // const index = parseIndex();
    // console.log("[\n\t" + Object.entries(index).slice(0, 10).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n\t") + "\n]");

    // const start = Date.now();
    // console.log(Object.keys(index).filter(k => k.includes("re")));
    // console.log(`Time: ${Date.now() - start}ms`);
    Book.processBooks("books", "traitement/books.csv");
}

// Run test
// !parseIndexCLI();

module.exports = { parseIndex, parseBookPaths, parseMetadata };
