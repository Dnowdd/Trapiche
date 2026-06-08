export interface BookPalette {
  bg: string
  fg: string
  pub?: string
}

export interface Book {
  id: string
  googleId?: string
  isbn?: string
  title: string
  author: string
  pages: number
  glyph: string
  palette: BookPalette
  coverUrl?: string
  description?: string
  rating?: {
    average: number
    count: number
  }
}

export interface GoogleBooksVolume {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    industryIdentifiers?: Array<{ type: string; identifier: string }>
    pageCount?: number
    categories?: string[]
    averageRating?: number
    ratingsCount?: number
    imageLinks?: {
      smallThumbnail?: string
      thumbnail?: string
      small?: string
      medium?: string
    }
    language?: string
  }
}

export interface GoogleBooksResponse {
  totalItems: number
  items?: GoogleBooksVolume[]
}
