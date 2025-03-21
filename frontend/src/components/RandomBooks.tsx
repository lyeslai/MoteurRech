import React from "react";
import { Book } from "../types";

interface RandomBooksProps {
    books: Book[];
}

const RandomBooks: React.FC<RandomBooksProps> = ({ books }) => {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Random Books</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((book) => (
                    <div
                        key={book.id}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                        <h3 className="text-xl font-bold mb-2">{book.title}</h3>
                        <p className="text-gray-600">{book.author}</p>
                        <p className="text-sm text-gray-500">{book.releaseDate}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RandomBooks;