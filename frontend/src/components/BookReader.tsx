import React, { useState, useEffect } from "react";
import { Book } from "../types";

interface BookReaderProps {
    book: Book;
}

const BookReader: React.FC<BookReaderProps> = ({ book }) => {
    const [pages, setPages] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [flipDirection, setFlipDirection] = useState<"left" | "right" | null>(null);

    // Split the book content into pages
    useEffect(() => {
        if (book.content) {
            const lines = book.content.split("\n");
            const linesPerPage = 24; // Adjust this value to control the number of lines per page
            const pagesArray = [];

            for (let i = 0; i < lines.length; i += linesPerPage) {
                pagesArray.push(lines.slice(i, i + linesPerPage).join("\n"));
            }

            setPages(pagesArray);
        }
    }, [book.content]);

    // Navigate to the previous page
    const goToPreviousPage = () => {
        if (currentPage > 0 && !isAnimating) {
            setIsAnimating(true);
            setFlipDirection("left");
            setTimeout(() => {
                setCurrentPage((prev) => prev - 2);
                setIsAnimating(false);
                setFlipDirection(null);
            }, 500); // Animation duration
        }
    };

    // Navigate to the next page
    const goToNextPage = () => {
        if (currentPage + 2 < pages.length && !isAnimating) {
            setIsAnimating(true);
            setFlipDirection("right");
            setTimeout(() => {
                setCurrentPage((prev) => prev + 2);
                setIsAnimating(false);
                setFlipDirection(null);
            }, 500); // Animation duration
        }
    };

    return (
        <div className="flex items-center justify-center w-full max-w-none mx-auto relative overflow-hidden bg-[#f5f2e9] p-6">
            {/* Previous Page Button */}
            <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0 || isAnimating}
                className="bg-[#6d4c41] text-white px-4 py-2 rounded-lg hover:bg-[#5a3c32] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                ←
            </button>

            {/* Book Container */}
            <div className="flex bg-[#fdfbf5] w-[90%] max-w-[1200px] h-[750px] rounded-lg shadow-lg overflow-hidden border border-[#d4c8b8] mx-4 relative">
                {/* Left Page */}
                <div
                    className={`w-1/2 p-8 bg-[#faf4e8] text-gray-800 text-justify overflow-y-auto border-r border-[#d4c8b8] transition-transform duration-500 ease-in-out ${flipDirection === "right" ? "flip-left" : ""}`}
                >
                    <pre className="font-serif text-base leading-relaxed max-w-[90%] mx-auto">
                        {pages[currentPage]}
                    </pre>
                </div>

                {/* Right Page */}
                {currentPage + 1 < pages.length && (
                    <div
                        className={`w-1/2 p-8 bg-[#faf4e8] text-gray-800 text-justify overflow-y-auto transition-transform duration-500 ease-in-out ${flipDirection === "left" ? "flip-right" : ""}`}
                    >
                        <pre className="font-serif text-base leading-relaxed max-w-[90%] mx-auto">
                            {pages[currentPage + 1]}
                        </pre>
                    </div>
                )}

                {/* Flipping Page (Overlay) */}
                {flipDirection && (
                    <div
                        className={`absolute w-1/2 h-full bg-[#faf4e8] border border-[#d4c8b8] ${flipDirection === "right" ? "right-0 origin-right flip-page-right" : "left-0 origin-left flip-page-left"}`}
                    >
                        <pre className="font-serif text-base leading-relaxed max-w-[90%] mx-auto p-8">
                            {flipDirection === "right" ? pages[currentPage + 2] : pages[currentPage - 1]}
                        </pre>
                    </div>
                )}
            </div>

            {/* Next Page Button */}
            <button
                onClick={goToNextPage}
                disabled={currentPage + 2 >= pages.length || isAnimating}
                className="bg-[#6d4c41] text-white px-4 py-2 rounded-lg hover:bg-[#5a3c32] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                →
            </button>
        </div>
    );
};

export default BookReader;