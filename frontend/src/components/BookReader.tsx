import React, { useState, useEffect, useRef } from "react";
import { Book } from "../types";
import HTMLFlipBook from "react-pageflip";

interface BookReaderProps {
    book: Book;
}

const BookReader: React.FC<BookReaderProps> = ({ book }) => {
    const [pages, setPages] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Check if the screen is mobile
    const flipBookRef = useRef<any>(null);

    // Split the book content into pages
    useEffect(() => {
        if (book.content) {
            const lines = book.content.split("\n");
            const charactersPerLine = isMobile ? 42 : 70; // Fewer characters per line on mobile
            const linesPerPage = isMobile ? 12 : 24; // Fewer lines per page on mobile
            const pagesArray = [];

            for (let i = 0; i < lines.length; i += linesPerPage) {
                pagesArray.push(
                    lines
                        .slice(i, i + linesPerPage)
                        .map((line) => {
                            if (line.length > charactersPerLine) {
                                const matchedLines = line.match(new RegExp(`.{1,${charactersPerLine}}`, "g"));
                                return matchedLines ? matchedLines.join("\n") : line;
                            }
                            return line;
                        })
                        .join("\n")
                );
            }

            setPages(pagesArray);
        }
    }, [book.content, isMobile]);

    // Handle window resize for responsiveness
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Navigate to the previous page
    const goToPreviousPage = () => {
        if (flipBookRef.current) {
            flipBookRef.current.pageFlip().flipPrev();
        }
    };

    // Navigate to the next page
    const goToNextPage = () => {
        if (flipBookRef.current) {
            flipBookRef.current.pageFlip().flipNext();
        }
    };

    // Handle page flip event
    const onFlip = (e: any) => {
        setCurrentPage(e.data);
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-none mx-auto relative overflow-hidden bg-amber-200 p-4 md:p-6">
            {/* Previous Page Button */}
            <button
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="bg-[#6d4c41] text-white px-4 py-2 rounded-lg hover:bg-[#5a3c32] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-4 md:mb-0 md:mr-4"
            >
                ←
            </button>

            {/* Book Container */}
            <HTMLFlipBook
                ref={flipBookRef}
                width={isMobile ? 300 : 600} // Dynamic width based on screen size
                height={isMobile ? 500 : 800} // Dynamic height based on screen size
                size="fixed" // Fixed size
                maxShadowOpacity={0.5} // Shadow intensity
                showCover={false} // Don't show a cover page
                flippingTime={500} // Animation duration in milliseconds
                mobileScrollSupport={false} // Disable mobile scroll to prevent conflicts
                onFlip={onFlip} // Handle page flip event
                className="book"
            >
                {pages.map((page, index) => (
                    <div key={index} className="page">
                        <pre className="font-serif text-sm md:text-base leading-relaxed max-w-[90%] mx-auto !p-1 md:p-8">
                            {page}
                        </pre>
                    </div>
                ))}
            </HTMLFlipBook>

            {/* Next Page Button */}
            <button
                onClick={goToNextPage}
                disabled={currentPage >= pages.length - 1}
                className="bg-[#6d4c41] text-white px-4 py-2 rounded-lg hover:bg-[#5a3c32] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mt-4 md:mt-0 md:ml-4"
            >
                →
            </button>
        </div>
    );
};

export default BookReader;