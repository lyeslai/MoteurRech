import React from "react";
import { Book, SearchResult } from "../types";
import BookCard from "./BookCard";

interface BookListProps {
    books: Book[] | SearchResult[];
    onBookClick: (id: number) => void;
}

const BookList: React.FC<BookListProps> = ({ books, onBookClick }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {books.map((book) => {
                if ("id" in book) {
                    return (
                        <BookCard
                            key={book.id}
                            book={book}
                            onBookClick={onBookClick}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
};

export default BookList;