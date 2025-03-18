import os
import pymongo
import spacy
from dotenv import load_dotenv
from tqdm import tqdm

# Charger les variables d'environnement
load_dotenv()

# Connexion MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/library")
client = pymongo.MongoClient(MONGODB_URI)
db = client["library"]
index_collection = db["index"]

# Charger spaCy
nlp = spacy.load("en_core_web_sm")
nlp.max_length = 8_000_000  # 🔹 Augmente la taille max pour éviter l'erreur de longueur

def process_large_text(text, chunk_size=100000):
    """Divise un texte en morceaux plus petits."""
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

def index_books():
    print("🔍 Début de l'indexation...")

    # Supprimer les anciens index
    deleted_count = index_collection.delete_many({}).deleted_count
    print(f"🗑️ Suppression des anciens index : {deleted_count} documents supprimés")

    # Récupérer tous les livres de la base
    books_collection = db["books"]
    books = list(books_collection.find())

    if not books:
        print("⚠️ Aucun livre trouvé dans la base de données !")
        return

    # 🔹 Index temporaire en mémoire
    temp_index = {}

    # 🔹 Lire les contenus des livres
    contents = []
    for book in books:
        file_path = os.path.join(book["contentPath"])
        if not os.path.exists(file_path):
            print(f"❌ Erreur: Fichier introuvable -> {file_path}")
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            contents.append((book, f.read()))

    # 🔹 Traiter les livres en parallèle avec nlp.pipe
    for book, doc in tqdm(zip(books, nlp.pipe([content for _, content in contents])), desc="📖 Traitement des livres"):
        word_counts = {}

        # 🔹 Extraction des mots valides
        for token in doc:
            if token.is_alpha and not token.is_stop and len(token.text) > 3:  # Exclut les stopwords et mots courts
                word = token.text.lower()
                word_counts[word] = word_counts.get(word, 0) + 1

        if word_counts:
            # 🔹 Ajouter au dictionnaire temporaire
            for word, count in word_counts.items():
                if word not in temp_index:
                    temp_index[word] = {}
                temp_index[word][str(book["_id"])] = count

            print(f"✅ Livre indexé : {book.get('title', 'Sans titre')} ({len(word_counts)} mots uniques)")

    # 🔹 Insérer en masse dans MongoDB
    if temp_index:
        print("📤 Insertion des mots-clés dans MongoDB...")
        index_collection.insert_many([{"word": word, "books": books} for word, books in temp_index.items()])

    print(f"✅ Indexation terminée ! {index_collection.count_documents({})} mots indexés.")
    client.close()

# 🚀 Lancer l'indexation
if __name__ == "__main__":
    index_books()