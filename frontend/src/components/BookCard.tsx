import { Book, SearchResult } from "../types";

interface BookCardProps {
    book: Book | SearchResult;
    onBookClick: (id: number) => void;
}

const BookCard = ({ book, onBookClick }: BookCardProps) => {
    if ('id' in book)
        return (
            <div
                key={book.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer transform hover:-translate-y-2"
                onClick={() => onBookClick(book.id)}
            >
                {/* Book Cover Image */}
                <div className="w-full h-96 overflow-hidden">
                    <img
                        src={`https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg`}
                        alt={`Cover of ${book.title}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback image if the cover is not available
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/150x200?text=No+Cover";
                        }}
                    />
                </div>

                {/* Book Details */}
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">{book.title}</h2>
                    <p className="text-gray-600 text-sm mb-2">
                        <span className="font-semibold">Author:</span> {book.author}
                    </p>
                    <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Release Date:</span> {book.releaseDate}
                    </p>
                </div>
            </div>
        );
};

export default BookCard