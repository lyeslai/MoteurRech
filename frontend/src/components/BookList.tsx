import React, { useState } from "react";
import { Book, SearchResult } from "../types";
import BookCard from "./BookCard";

interface BookListProps {
    books: Book[] | SearchResult[];
    onBookClick: (id: number) => void;
    displaySort?: boolean;
}

const BookList: React.FC<BookListProps> = ({ books, onBookClick, displaySort = false }) => {
    console.log(books);

    const [selectedSort, setSelectedSort] = useState<string>("relevance");
    const [sortOrder, setSortOrder] = useState<string>("asc");

    const sortBooks = (books: (Book | SearchResult)[]) => {
        const order = sortOrder === "asc" ? 1 : -1;
        return [...books].sort((a, b) => {
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

    return (
        <div>
            {/* Sorting Controls */}
            {displaySort && <div className="flex justify-start items-center gap-6 p-4 mb-4 bg-gray-800 max-w-fit rounded-md text-white">
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
            </div>}

            {/* Sorted Book List */}
            <div className="min-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortBooks(books).map((book) => (
                    "id" in book && (
                        <BookCard key={book.id} book={book} onBookClick={onBookClick} />
                    )
                ))}
            </div>
        </div>
    );
};

export default BookList;
