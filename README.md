# MoteurRech - Moteur de Recherche de Livres

MoteurRech est un moteur de recherche performant basé sur un index de plus de 1680 livres provenant du Projet Gutenberg. Il utilise des expressions régulières et des mesures de similarité textuelle pour offrir des résultats pertinents.

## Fonctionnalités

- Indexation de livres : Création d’une table d’index pour un accès rapide aux ouvrages.
- Recherche optimisée : Utilisation des expressions régulières pour des recherches avancées.
- Analyse de similarité : Calcul de la matrice de Jaccard et de l'indice de centralité pour classer les résultats.
- Interface moderne : Un frontend réactif pour une expérience utilisateur fluide.

---

## Installation

Assurez-vous d'avoir **Node.js**, **npm**, et **Python3** installés sur votre machine.

### 1. Installation des dépendances

Clonez le projet et installez les packages nécessaires :

```bash
cd MoteurRech
npm install
cd frontend/
npm install
```

### 2. Téléchargement des livres

Exécutez le script Python pour importer et indexer les livres :

```bash
python3 scripts/import_Books.py
```

## Lancement de l'application
dans le terminal 1:
```bash
node server.js
```

dans le terminal 2:
```bash
cd frontend/
npm run dev
```

## Données générées

	- Table d’index : Stockée dans out/, elle permet une recherche rapide parmi 1680+ livres.
	- Matrice de Jaccard : Mesure de similarité entre les textes, utile pour le classement des résultats.
	- Indice de centralité : Identifie les livres les plus représentatifs du corpus.

## Perspectives

	- Optimisation des performances pour une indexation plus rapide.
	- Moteur de recherche sémantique avec NLP.
	- Ajout de nouvelles sources de livres.
