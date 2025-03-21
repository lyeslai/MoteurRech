export interface Book {
    id: number;
    title: string;
    author: string;
    releaseDate: string;
    content?: string;
    relevance?: number;
    occurrence?: number;
}

export interface SearchResult {
    book: Book;
    occurrence: number;
}

export interface Recommendation {
    id: number;
    distance: number;
    centrality: number;
}