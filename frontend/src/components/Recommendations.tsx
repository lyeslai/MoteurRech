import React from "react";
import { Book } from "../types";
import BookCard from "./BookCard";

interface RecommendationsProps {
    recommendations: Book[];
    onBookClick: (id: number) => void;
}

const Recommendations: React.FC<RecommendationsProps> = ({ recommendations, onBookClick }) => {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((book) =>
                    "id" in book ? (
                        <BookCard
                            key={book.id}
                            book={book}
                            onBookClick={onBookClick}
                        />
                    ) : null
                )}
            </div>
        </div>
    );
};

export default Recommendations;