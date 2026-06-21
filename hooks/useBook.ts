'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getBooks,
  createBook,
  updateBookStatus,
  searchBooks as searchBooksApi,
  isValidCoverUrl,
} from '@/lib/books'
import type { Book, BookStatus, KakaoBook } from '@/types'

async function enrichCovers(books: Book[]): Promise<Book[]> {
  const missing = books.filter((b) => !isValidCoverUrl(b.cover_url) && b.isbn)
  if (missing.length === 0) return books

  const results = await Promise.all(
    missing.map(async (b) => {
      try {
        const res = await fetch(`/api/cover?isbn=${encodeURIComponent(b.isbn!)}`)
        if (!res.ok) return { id: b.id, thumbnail: '' }
        const json = (await res.json()) as { thumbnail: string }
        return { id: b.id, thumbnail: json.thumbnail ?? '' }
      } catch {
        return { id: b.id, thumbnail: '' }
      }
    })
  )

  const coverMap = new Map(results.filter((r) => r.thumbnail).map((r) => [r.id, r.thumbnail]))
  if (coverMap.size === 0) return books

  return books.map((b) =>
    coverMap.has(b.id) ? { ...b, cover_url: coverMap.get(b.id) } : b
  )
}

export function useBook(userId: string | undefined) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const [searchResults, setSearchResults] = useState<KakaoBook[]>([])
  const [searching, setSearching] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) {
      setBooks([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getBooks(userId)
      setBooks(await enrichCovers(data))
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
    const created = await createBook(book)
    setBooks((prev) => [created, ...prev])
    return created
  }

  async function changeStatus(id: string, status: BookStatus) {
    const updated = await updateBookStatus(id, status)
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)))
    return updated
  }

  async function searchBooks(query: string) {
    setSearching(true)
    setError(null)
    try {
      const results = await searchBooksApi(query)
      setSearchResults(results)
      return results
    } catch (e) {
      setError(e as Error)
      return []
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setSearchResults([])
  }

  return {
    books,
    loading,
    error,
    refresh,
    addBook,
    changeStatus,
    searchResults,
    searching,
    searchBooks,
    clearSearch,
  }
}
