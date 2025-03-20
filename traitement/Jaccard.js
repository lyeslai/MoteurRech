const fs = require('fs');
const path = require('path');
const Book = require('./book'); // Assuming Book.js is in the same directory

/**
 * Converts a plain object to a Map.
 *
 * @param {Object} obj - The plain object to convert.
 * @returns {Map} - The converted Map.
 */
function objectToMap(obj) {
    return new Map(Object.entries(obj));
}

/**
 * Calculates the Jaccard distance between two books.
 *
 * @param {number} book1 - The ID of the first book.
 * @param {number} book2 - The ID of the second book.
 * @param {Map<number, Map<string, number>>} words - Map of book IDs to their word occurrences.
 * @returns {number} - Jaccard distance (0 = identical, 1 = no similarity).
 */
function jaccardDistance(book1, book2, words) {
    const words1 = objectToMap(words.get(book1) || new Map());
    const words2 = objectToMap(words.get(book2) || new Map());
    const allWords = new Set([...words1.keys(), ...words2.keys()]);

    let minSum = 0;
    let maxSum = 0;

    allWords.forEach(word => {
        const wc1 = words1.get(word) || 0;
        const wc2 = words2.get(word) || 0;
        minSum += Math.min(wc1, wc2);
        maxSum += Math.max(wc1, wc2);
    });

    const similarity = maxSum === 0 ? 0 : minSum / maxSum;
    if (similarity < 0 || similarity > 1) {
        throw new Error(`Jaccard similarity must be between 0 and 1, got ${similarity}`);
    }

    return 1 - similarity; // Distance
}

/**
 * Computes the Jaccard distance matrix for a list of books.
 *
 * @param {number[]} books - List of book IDs.
 * @param {Map<number, Map<string, number>>} words - Map of book IDs to their word occurrences.
 * @returns {number[][]} - Jaccard distance matrix.
 */
function jaccardMatrix(books, words) {
    const matrix = Array.from({ length: books.length }, () => Array(books.length).fill(0));

    for (let i = 0; i < books.length; i++) {
        console.log(`Processing book ${i + 1} of ${books.length}`);
        for (let j = i; j < books.length; j++) {
            const distance = jaccardDistance(books[i], books[j], words);
            matrix[i][j] = distance;
            matrix[j][i] = distance;
        }
    }

    return matrix;
}

/**
 * Prints the Jaccard distance matrix.
 *
 * @param {number[][]} matrix - The Jaccard distance matrix.
 */
function printMatrix(matrix) {
    console.log("    " + matrix.map((_, i) => i.toString().padStart(2)).join("  "));
    matrix.forEach((row, i) => {
        console.log(`${i.toString().padStart(2)}: ` + row.map(val => val.toFixed(1)).join(" "));
    });
}

/**
 * Writes the Jaccard distance matrix to a file.
 *
 * @param {number[]} bookIds - List of book IDs.
 * @param {number[][]} matrix - The Jaccard distance matrix.
 */
function writeMatrix(bookIds, matrix) {
    const outDirPath = "out";
    if (!fs.existsSync(outDirPath)) {
        fs.mkdirSync(outDirPath);
    }

    const outPath = path.join(outDirPath, "jaccard_matrix.txt");
    const content = bookIds.join(";") + "\n" + matrix.map(row => row.join(";")).join("\n");
    fs.writeFileSync(outPath, content);
}

/**
 * Computes the closeness centrality for each book in the matrix.
 *
 * @param {number[][]} matrix - The Jaccard distance matrix.
 * @returns {number[]} - Array of closeness centrality values.
 */
function closenessCentrality(matrix) {
    const size = matrix.length;
    const centrality = new Array(size).fill(0);

    for (let i = 0; i < size; i++) {
        const sum = matrix[i].reduce((acc, val) => acc + val, 0);
        // Normalize by dividing by (size - 1)
        centrality[i] = sum === 0 ? 0 : (size - 1) / (sum * (size - 1));
    }

    return centrality;
}

/**
 * Writes the closeness centrality values to a file.
 *
 * @param {number[]} bookIds - List of book IDs.
 * @param {number[]} centrality - Array of closeness centrality values.
 */
function writeCentrality(bookIds, centrality) {
    const outDirPath = "out";
    if (!fs.existsSync(outDirPath)) {
        fs.mkdirSync(outDirPath);
    }

    const outPath = path.join(outDirPath, "closeness_centrality.txt");
    const content = bookIds.join(";") + "\n" + centrality.join(";");
    fs.writeFileSync(outPath, content);
}

async function parseCentrality() {
    const content = fs.readFileSync("out/closeness_centrality.txt", "utf-8");
    const [header, ...lines] = content.split("\n");
    const bookIds = header.split(";").map(Number);
    const centrality = lines[0].split(";").map(Number);
    return bookIds.map((id, i) => [id, centrality[i]]);
}

async function parseMatrix() {
    const outDirPath = "out";
    const matrixFilePath = path.join(outDirPath, "jaccard_matrix.txt");

    if (!fs.existsSync(matrixFilePath)) {
        console.log(`Matrix file not found at: ${matrixFilePath}`);
        return {};
    }

    try {
        const data = fs.readFileSync(matrixFilePath, "utf8");
        const lines = data.split("\n").filter(line => line.trim() !== ""); // Remove empty lines

        if (lines.length === 0) return {};

        // Parse header line for book IDs
        const bookIds = lines[0].split(";").map(Number);

        // Parse the actual matrix
        const matrix = {};
        for (let i = 0; i < bookIds.length; i++) {
            const bookId = bookIds[i];
            const distances = lines[i + 1].split(";").map(Number);
            matrix[bookId] = bookIds.reduce((acc, id, j) => {
                acc[id] = distances[j];
                return acc;
            }, {});
        }

        return matrix;
    } catch (error) {
        console.log(`Error reading matrix from ${matrixFilePath}: ${error.message}`);
        return {};
    }
}


/**
 * Main function to compute and display Jaccard distances and centrality.
 */
async function main() {
    const dir = "books";
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.txt'));

    const books = files.map(file => {
        const book = Book.parse(path.join(dir, file));
        return [book.id, book.wordsWithOccurrences(), book.id];
    });

    const bookIds = books.map(book => book[2]);
    const words = new Map(books.map(book => [book[2], book[1]]));

    const matrix = jaccardMatrix(bookIds, words);
    console.log("------------MATRIX------------");
    console.log(bookIds);
    printMatrix(matrix);
    writeMatrix(bookIds, matrix);

    console.log("----------CENTRALITY----------");
    const centrality = closenessCentrality(matrix);
    centrality.forEach(val => process.stdout.write(`${val.toFixed(2)} `));
    writeCentrality(bookIds, centrality);
    console.log();
}

// Run the main function
!main().catch(console.error);

module.exports = { parseCentrality, parseMatrix, jaccardMatrix };