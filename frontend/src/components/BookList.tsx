import React, { useState } from "react";
import { Book, SearchResult } from "../types";
import BookCard from "./BookCard";

interface BookListProps {
    books: Book[] | SearchResult[];
    onBookClick: (id: number) => void;
    displaySort?: boolean;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalBooks: number;
}

const BookList: React.FC<BookListProps> = ({
    books,
    onBookClick,
    displaySort = false,
    currentPage,
    setCurrentPage,
    totalBooks,
}) => {
    const [selectedSort, setSelectedSort] = useState<string>("relevance");
    const [sortOrder, setSortOrder] = useState<string>("asc");
    const booksPerPage = 9; // Set items per page

    const sortBooks = (books: (Book | SearchResult)[]) => {
        const validBooks = books.filter((book) => book && typeof book === "object");

        const order = sortOrder === "asc" ? 1 : -1;

        return [...validBooks].sort((a, b) => {
            if ("occurrence" in a && "occurrence" in b) {
                if (selectedSort === "relevance") {
                    if (a.occurrence === b.occurrence) {
                        if ("relevance" in a && "relevance" in b) {
                            return order * ((a.relevance ?? 0) - (b.relevance ?? 0));
                        }
                        return 0;
                    }
                    return order * ((a.occurrence ?? 0) - (b.occurrence ?? 0));
                }
            }
            if (selectedSort === "title") {
                if ("title" in a && "title" in b) {
                    return order * a.title.localeCompare(b.title);
                }
                return 0;
            } else if (selectedSort === "author") {
                if ("author" in a && "author" in b) {
                    return order * a.author.localeCompare(b.author);
                }
                return 0;
            } else if (selectedSort === "date") {
                if ("releaseDate" in a && "releaseDate" in b) {
                    return order * (new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
                }
                return 0;
            }
            return 0;
        });
    };

    const sortedBooks = sortBooks(books);
    const totalPages = Math.ceil(totalBooks / booksPerPage);

    return (
        <div className="container mx-auto my-4 p-4">
            {displaySort && (
                <div className="flex justify-start items-center gap-6 p-4 mb-4 bg-gray-800 max-w-fit rounded-md text-white">
                    <label className="font-semibold">Sort by:</label>
                    <select
                        className="border px-2 py-1 rounded bg-gray-800"
                        value={selectedSort}
                        onChange={(e) => setSelectedSort(e.target.value)}
                    >
                        <option value="relevance">Relevance</option>
                        <option value="title">Title</option>
                        <option value="author">Author</option>
                        <option value="date">Date</option>
                    </select>

                    <button
                        className="text-black border px-2 py-1 rounded bg-gray-200"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                        {sortOrder === "asc" ? "Ascending" : "Descending"}
                    </button>
                </div>
            )}

            <div className="min-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedBooks.map((book) =>
                    "id" in book ? (
                        <BookCard key={book.id} book={book} onBookClick={onBookClick} />
                    ) : null
                )}
            </div>

            {totalPages > 1 && (
                <div className="w-full flex justify-center">
                    <div className="flex justify-center items-center gap-4 mt-8 bg-gray-800 max-w-fit rounded-md p-4 text-white">
                        <button
                            className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 cursor-pointer"
                            onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        <span className="text-lg font-semibold">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 cursor-pointer"
                            onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookList;
