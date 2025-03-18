import os
import re
import json
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Assurez-vous d'avoir téléchargé les stopwords de NLTK
import nltk
nltk.download('punkt')
nltk.download('stopwords')

# Chemin vers le dossier contenant les livres
livres_dossier = './books'
# Chemin vers le dossier où les fichiers JSON seront sauvegardés
indexed_dossier = '/books/indexed_books'

# Créer le dossier indexed_books s'il n'existe pas
os.makedirs(indexed_dossier, exist_ok=True)

# Liste des stopwords en français
stop_words = set(stopwords.words('french'))

def pretraitement_texte(texte):
    # Supprimer les caractères spéciaux et les nombres
    texte = re.sub(r'[^a-zA-Zà-ÿÀ-Ÿ\s]', '', texte)
    # Convertir en minuscules
    texte = texte.lower()
    # Tokeniser le texte
    mots = word_tokenize(texte)
    # Supprimer les stopwords
    mots_cles = [mot for mot in mots if mot not in stop_words]
    return mots_cles

def indexer_livres(dossier_livres, dossier_index):
    for fichier in os.listdir(dossier_livres):
        if fichier.endswith('.txt'):
            chemin_fichier = os.path.join(dossier_livres, fichier)
            with open(chemin_fichier, 'r', encoding='utf-8') as f:
                texte = f.read()

            mots_cles = pretraitement_texte(texte)
            # Compter les occurrences de chaque mot-clé
            occurrences = Counter(mots_cles)

            index = {
                'livre': fichier,
                'mots_cles': occurrences
            }

            # Sauvegarder l'index dans un fichier JSON dans le dossier indexed_books
            chemin_json = os.path.join(dossier_index, fichier.replace('.txt', '.json'))
            with open(chemin_json, 'w', encoding='utf-8') as f_json:
                json.dump(index, f_json, ensure_ascii=False, indent=4)

# Exécuter l'indexation
indexer_livres(livres_dossier, indexed_dossier)
