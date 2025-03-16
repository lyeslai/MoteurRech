import { useState } from "react";
import axios from "axios";

function App() {
  const [query, setQuery] = useState<string>("");
  const [mode, setMode] = useState<string>("kmp");
  const [books, setBooks] = useState<{ _id: string; title: string; author: string }[]>([]);

  const handleSearch = () => {
    console.log("🔍 Recherche envoyée avec:", query, mode);
    axios.get(`http://localhost:3000/api/books/search?query=${query}&mode=${mode}`)
      .then(response => {
        console.log("✅ Résultats reçus:", response.data);
        setBooks(response.data);
      })
      .catch(error => console.error("❌ Erreur API:", error));
  };
  

  return (
    <div>
      <h1>📚 Recherche de Livres</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher..."
      />
      <select onChange={(e) => setMode(e.target.value)}>
        <option value="kmp">KMP</option>
        <option value="regex">RegEx</option>
      </select>
      <button onClick={handleSearch}>Rechercher</button>
      <ul>
        {books.map(book => (
          <li key={book._id}>
            <strong>{book.title}</strong> - {book.author}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
