import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import axios from "axios";
import BookList from "./components/BookList";
import SearchBar from "./components/SearchBar";
// import Recommendations from "./components/Recommendations";
import RandomBooks from "./components/RandomBooks";
import { Book, SearchResult } from "./types";
// import BookCard from "./components/BookCard";
import BookDetails from "./components/BookDetails";

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [randomBooks, setRandomBooks] = useState<Book[]>([]);

  useEffect(() => {
    // Fetch all books
    axios.get<Book[]>("http://localhost:3000/api/books/books")
      .then((response) => setBooks(response.data))
      .catch((error) => console.error("Error fetching books:", error));

    // Fetch random books
    axios.get<Book[]>("http://localhost:3000/api/books/random-books")
      .then((response) => setRandomBooks(response.data))
      .catch((error) => console.error("Error fetching random books:", error));
  }, []);

  const handleSearch = (results: SearchResult[]) => {
    setSearchResults(results);
    console.log(results);

  };

  return (
    <Router>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">Book Search App</h1>
        <SearchBar onSearch={handleSearch} />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <BookList
                  books={searchResults.length > 0 ? searchResults : books}
                  onBookClick={(id) => (window.location.href = `/book/${id}`)}
                />
                <RandomBooks books={randomBooks} />
              </>
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