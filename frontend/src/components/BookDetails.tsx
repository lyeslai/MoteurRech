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
        // Fetch recommendations
        axios.get<Book[]>(`http://localhost:3000/api/books/recommendations/${book?.id}`)
            .then((response) => setRecommendations(response.data))
            .catch((error) => console.error("Error fetching books:", error));
    }, [book]);

    if (!book) return <div className="text-center">Loading...</div>;

    return (
        <div className="container mx-auto p-6">
            <BookReader book={book} />
            <div>
                {recommendations.length > 0 &&
                    <div className="min-w-full flex flex-col justify-center items-start">
                        <h2 className="text-2xl text-white font-bold my-8">Top 3 recommendations</h2>
                        <BookList
                            books={recommendations.slice(0, 3)}
                            onBookClick={(id) => (window.location.href = `/book/${id}`)}
                        />
                    </div>
                }
            </div>
        </div>
    );
};

export default BookDetails;