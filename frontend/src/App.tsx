import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import axios from "axios";
import BookList from "./components/BookList";
import SearchBar from "./components/SearchBar";
// import Recommendations from "./components/Recommendations";
import { Book, SearchResult } from "./types";
// import BookCard from "./components/BookCard";
import BookDetails from "./components/BookDetails";

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    // Fetch all books
    axios.get<Book[]>("http://localhost:3000/api/books/books")
      .then((response) => setBooks(response.data))
      .catch((error) => console.error("Error fetching books:", error));
  }, []);

  const handleSearch = (results: SearchResult[]) => {
    setSearchResults(results);
  };

  return (
    <Router>
      <div className="mx-auto flex flex-col items-center">
        <div className="min-w-full bg-gray-800 p-4 mb-8">
          <div className="px-44 flex flex-col justify-center items-center">
            <h1 className="text-3xl text-white font-bold mb-8 cursor-pointer" onClick={() => window.location.href = '/'}>Book Search App</h1>
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
        <Routes>
          <Route
            path="/"
            element={
              <div className="container   ">
                <BookList
                  books={searchResults.length > 0 ? searchResults : books}
                  onBookClick={(id) => (window.location.href = `/book/${id}`)}
                  displaySort={true}
                />
                {/* <RandomBooks books={randomBooks} /> */}
              </div>
            }
          />
          <Route path="/book/:bookId" element={<BookDetailsWrapper />} />
        </Routes>
      </div>
    </Router>
  );
};

const BookDetailsWrapper: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    // Fetch book details
    axios.get<Book>(`http://localhost:3000/api/books/book/${bookId}`)
      .then((response) => setBook(response.data))
      .catch((error) => console.error("Error fetching book details:", error));
  }, [bookId]);

  return <BookDetails book={book} />;
};

export default App;