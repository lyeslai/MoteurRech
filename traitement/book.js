const fs = require('fs');
const path = require('path');

class Book {
    constructor(id, title, author, releaseDate, content) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.releaseDate = releaseDate;
        this.content = content;
    }

    static parse(filePath) {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        let title = '';
        let author = '';
        let releaseDate = '';
        let id = 0;

        let i = 0;
        // First pass: Look for metadata before the START line
        while (i < lines.length && !lines[i].startsWith("*** START OF THE PROJECT GUTENBERG EBOOK") && !lines[i].startsWith("*** START OF THIS PROJECT GUTENBERG EBOOK")) {
            const line = lines[i].trim();

            if (line.toLowerCase().startsWith("title: ")) {
                title = line.substring("Title: ".length).trim();
            } else if (line.toLowerCase().startsWith("author: ")) {
                author = line.substring("Author: ".length).trim();
            } else if (line.toLowerCase().startsWith("by ")) {
                author = line.substring("By ".length).trim();
            } else if (line.toLowerCase().startsWith("release date: ")) {
                releaseDate = line.substring("Release Date: ".length).split('[')[0].trim();
                // Extract ID from the release date line if it exists
                const idMatch = line.match(/#(\d+)/);
                if (idMatch) {
                    id = parseInt(idMatch[1], 10);
                }
            }
            i++;
        }

        // Extract ID from the START line if not found earlier
        if (id === 0 && i < lines.length) {
            const startLine = lines[i].trim();
            const startIdMatch = startLine.match(/(\d+)\s*\*\*\*$/);

            if (startIdMatch) {
                id = parseInt(startIdMatch[1], 10);
            }
        }

        // Second pass: If metadata is missing, look for it after the START line
        if (!title || !author || !releaseDate) {
            // Look for metadata after the START line
            let j = i + 1; // Start searching after the START line
            let isTitleFound = false;

            while (j < lines.length && !lines[j].startsWith("Contents")) {
                const line = lines[j].trim();

                // Skip empty lines, irrelevant metadata, and illustration markers
                if (line.length === 0 || line.startsWith('There are') || line.startsWith('cover') || line.startsWith('Click on') || line.startsWith('[Illustration]')) {
                    j++;
                    continue;
                }

                // If the title is missing, assume the first non-skipped line is the title
                if (!title && line.length > 0) {
                    title = line;
                    isTitleFound = true;
                } else if (line.toLowerCase().startsWith("by ")) {
                    author = line.substring("By ".length).trim();
                } else if (line.toLowerCase().startsWith("copyright ")) {
                    releaseDate = line.substring("copyright ".length).split('[')[0].trim();
                    // Extract ID from the release date line if it exists
                    const idMatch = line.match(/#(\d+)/);
                    if (idMatch) {
                        id = parseInt(idMatch[1], 10);
                    }
                }
                j++;
            }
        }

        // Extract the content
        const content = lines
            .slice(i)
            .join('\n')
            .split("*** END OF THIS PROJECT GUTENBERG EBOOK")[0]
            .split("*** END OF THE PROJECT GUTENBERG EBOOK")[0]
            .trim();

        return new Book(id, title, author, releaseDate, content);
    }


    static async processBooks(directory, outputCsv) {
        const files = fs.readdirSync(directory).filter(file => file.endsWith('.txt'));
        let count = 0;
        const books = files.map(file => {
            try {
                count++;
                return Book.parse(path.join(directory, file));
            } catch (e) {
                console.error(`Error parsing ${file}: ${e.message}`);
                return null;
            }
        }).filter(book => book !== null);

        Book.saveToCsv(books, outputCsv);
        console.log(`✅ ${count} Books processed and saved to ${outputCsv}`);
    }

    static saveToCsv(books, outputFile) {
        const writer = fs.createWriteStream(outputFile);
        writer.write("ID,Title,Author,ReleaseDate\n");
        books.forEach(book => {
            writer.write(`"${book.id}","${book.title}","${book.author}","${book.releaseDate}"\n`);
        });
        writer.end();
    }

    wordsWithOccurrences() {
        const wordCounts = {};
        const words = this.content.toLowerCase().split(/[^a-zA-Z]+/).filter(word => word.length > 0);
        words.forEach(word => {
            if (word === 'constructor')
                return;
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        return wordCounts;
    }
}

module.exports = Book;