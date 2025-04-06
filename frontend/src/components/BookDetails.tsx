import React, { useEffect, useState } from "react";
import { Book } from "../types";
import BookReader from "./BookReader";
import BookList from "./BookList";
import axios from "axios";

interface BookDetailsProps {
    book: Book | null;
}

const BookDetails: React.FC<BookDetailsProps> = ({ book }) => {
    const [recommendations, setRecommendations] = useState<Book[]>([]);

    useEffect(() => {
        if (!book?.id) return; // Ensure book.id is available before making the request

        // Fetch recommendations
        axios.get<Book[]>(`http://localhost:3000/api/books/recommendations/${book?.id}`)
            .then((response) => setRecommendations(response.data))
            .catch((error) => console.error("Error fetching books:", error));
    }, [book?.id]);

    if (!book) return <div className="text-center">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
            <BookReader book={book} />
            {recommendations.length > 0 &&
                <div className="my-8 min-w-full flex flex-col justify-center items-start bg-gray-600 rounded-md">
                    <h2 className="text-2xl text-white font-bold p-4">Top 3 recommendations</h2>
                    <BookList
                        books={recommendations.filter(book => book !== null).slice(0, 3)}
                        onBookClick={(id) => (window.location.href = `/book/${id}`)}
                    />
                </div>
            }
        </div>
    );
};

export default BookDetails;