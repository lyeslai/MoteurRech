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
        while (!lines[i].startsWith("*** START OF THE PROJECT GUTENBERG EBOOK") && !lines[i].startsWith("*** START OF THIS PROJECT GUTENBERG EBOOK")) {
            if (lines[i].toLowerCase().startsWith("title: ")) {
                title = lines[i].substring("Title: ".length).trim();
            } else if (lines[i].toLowerCase().startsWith("author: ")) {
                author = lines[i].substring("Author: ".length).trim();
            } else if (lines[i].toLowerCase().startsWith("release date: ")) {
                releaseDate = lines[i].substring("Release Date: ".length).split('[')[0].trim();
                if (lines[i].includes('[')) {
                    id = parseInt(lines[i].match(/#(\d+)/)[1]);
                }
            }
            i++;
        }

        const text = lines.slice(i).join('\n').split("*** END OF THIS PROJECT GUTENBERG EBOOK")[0].split("*** END OF THE PROJECT GUTENBERG EBOOK")[0].trim();

        return new Book(id, title, author, releaseDate, text);
    }

    static async processBooks(directory, outputCsv) {
        const files = fs.readdirSync(directory).filter(file => file.endsWith('.txt'));
        const books = files.map(file => {
            try {
                return Book.parse(path.join(directory, file));
            } catch (e) {
                console.error(`Error parsing ${file}: ${e.message}`);
                return null;
            }
        }).filter(book => book !== null);

        Book.saveToCsv(books, outputCsv);
        console.log(`✅ Books processed and saved to ${outputCsv}`);
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
        const words = this.content.toLowerCase().split(/\W+/).filter(word => word.length > 0);
        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        return wordCounts;
    }
}

module.exports = Book;