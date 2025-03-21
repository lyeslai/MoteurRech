import React from "react";
import { Book } from "../types";
import BookReader from "./BookReader";

interface BookDetailsProps {
    book: Book | null;
}

const BookDetails: React.FC<BookDetailsProps> = ({ book }) => {
    if (!book) return <div className="text-center">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
            <BookReader book={book} />
        </div>
    );
};

export default BookDetails;