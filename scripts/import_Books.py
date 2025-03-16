#!/usr/bin/env python3
import os
import re
import asyncio
import aiohttp
import motor.motor_asyncio
from datetime import datetime
from dotenv import load_dotenv
import pymongo
from urllib.parse import urlparse

# Charger les variables d'environnement
load_dotenv()

# Configuration MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/library")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client['library']
books_collection = db.books

# Configuration du dossier local pour stocker les livres
SAVE_DIRECTORY = "books/"
os.makedirs(SAVE_DIRECTORY, exist_ok=True)

# Configuration pour les requêtes HTTP
MAX_CONCURRENT_REQUESTS = 10
semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

# Fonction pour compter les mots dans un texte
def count_words(text):
    return len(re.findall(r'\b\w+\b', text))

# Fonction pour télécharger le contenu d'un livre de manière asynchrone
async def download_content(session, url):
    async with semaphore:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    print(f"Failed to download from {url}, status code: {response.status}")
                    return None
        except Exception as e:
            print(f"Error downloading content from {url}: {e}")
            return None

# Fonction pour traiter un livre
async def process_book(session, book, min_word_count):
    try:
        existing_book = await books_collection.find_one({"gutendexId": book["id"]})
        if existing_book:
            print(f"Book '{book['title']}' (ID: {book['id']}) already exists. Skipping...")
            return False

        # Récupérer le texte brut
        text_format = next((book["formats"][fmt] for fmt in ["text/plain", "text/plain; charset=utf-8", "text/plain; charset=us-ascii"] if fmt in book["formats"]), None)
        if not text_format:
            print(f"No text format for '{book['title']}' (ID: {book['id']}). Skipping...")
            return False

        text_content = await download_content(session, text_format)
        if not text_content:
            print(f"Failed to download '{book['title']}' (ID: {book['id']}). Skipping...")
            return False

        word_count = count_words(text_content)
        if word_count < min_word_count:
            print(f"Book '{book['title']}' has less than {min_word_count} words. Skipping...")
            return False

        # Sauvegarder le texte dans un fichier local
        file_path = os.path.join(SAVE_DIRECTORY, f"book_{book['id']}.txt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        # Récupérer l'URL de la couverture (stockée en ligne, pas en local)
        cover_url = book["formats"].get("image/jpeg", None)

        # Enregistrer dans MongoDB sans stocker le texte
        author = book["authors"][0]["name"] if book["authors"] else "Unknown"
        new_book = {
            "gutendexId": book["id"],
            "title": book["title"],
            "author": author,
            "languages": book["languages"],
            "downloadCount": book.get("download_count", 0),
            "subjects": book.get("subjects", []),
            "wordCount": word_count,
            "contentPath": file_path,  # Chemin vers le fichier local
            "coverUrl": cover_url,
            "createdAt": datetime.now()
        }

        await books_collection.insert_one(new_book)
        print(f"📚 Saved '{book['title']}' (ID: {book['id']}) with content in file.")
        return True
    except Exception as e:
        print(f"Error processing '{book.get('title', 'Unknown')}': {e}")
        return False

# Fonction principale pour télécharger et sauvegarder les livres
async def download_and_save_books(min_word_count=10000, min_books=1000):
    page = 1
    total_books = 0
    saved_books = 0
    failed_books = 0
    print(f"Downloading books with minimum {min_word_count} words until we have at least {min_books} books...")
    async with aiohttp.ClientSession() as session:
        while saved_books < min_books:
            try:
                print(f"Fetching page {page} from Gutendex API...")
                async with session.get(f"https://gutendex.com/books/?page={page}") as response:
                    if response.status != 200:
                        print(f"Error fetching books from Gutendex API: Status code {response.status}")
                        await asyncio.sleep(5)
                        continue
                    
                    data = await response.json()
                    if not data.get("results") or len(data["results"]) == 0:
                        print("No more books available from Gutendex API.")
                        break
                    
                    books = data["results"]
                    total_books += len(books)
                    tasks = [process_book(session, book, min_word_count) for book in books]
                    results = await asyncio.gather(*tasks)
                    
                    new_saved = sum(1 for r in results if r)
                    new_failed = sum(1 for r in results if not r)
                    saved_books += new_saved
                    failed_books += new_failed
                    
                    print(f"Page {page} processed. New books saved: {new_saved}. Total books saved: {saved_books}")
                    
                    if saved_books >= min_books:
                        print(f"Successfully saved {saved_books} books with at least {min_word_count} words.")
                        break
                    
                    if data.get("next"):
                        page += 1
                    else:
                        print("No more pages available from Gutendex API.")
                        break
                
            except Exception as e:
                print(f"Error fetching books from Gutendex API: {e}")
                await asyncio.sleep(5)
    
    print(f"Finished downloading books. Total books processed: {total_books}. Saved: {saved_books}. Failed: {failed_books}.")

# Point d'entrée principal
async def main():
    start_time = datetime.now()
    try:
        await download_and_save_books(100000, 1000)
    finally:
        client.close()
        end_time = datetime.now()
        execution_time = end_time - start_time
        print(f"Script completed in {execution_time}")

if __name__ == "__main__":
    asyncio.run(main())
