export interface BookPalette {
  bg: string;
  fg: string;
  pub?: string;
}

export interface Book {
  id: string;
  googleId?: string;
  isbn?: string;
  title: string;
  author: string;
  pages: number;
  glyph: string;
  palette: BookPalette;
  coverUrl?: string;
  description?: string;
  rating?: {
    average: number;
    count: number;
  };
}

export interface CatalogBook extends Book {
  googleId: string;
  slug: string;
  subtitle?: string;
  authors: string[];
  requested: { title: string; author: string };
  publisher?: string;
  publishedDate?: string;
  year?: number;
  categories: string[];
  language?: string;
  isbn13?: string;
  isbn10?: string;
  thumbnailUrl?: string;
  pinned: boolean;
  matchScore: number | null;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  year: string | null;
  publisher: string | null;
  coverUrl: string | null;
  editions: number;
}

export interface BookCatalog {
  generatedAt: string;
  source: string;
  total: number;
  books: CatalogBook[];
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    workEditions?: number;
    olWork?: string;
    olWorkTitle?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    dimensions?: {
      height?: string;
      width?: string;
      thickness?: string;
    };
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}
