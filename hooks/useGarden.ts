'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getPlants,
  createPlant,
  updatePlant,
  waterPlant as waterPlantLib,
} from '@/lib/garden'
import type { Plant, Quote } from '@/types'

export function useGarden(userId: string | undefined) {
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setPlants([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getPlants(userId)
      setPlants(data)
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addPlant(plant: Omit<Plant, 'id' | 'created_at'>) {
    const created = await createPlant(plant)
    setPlants((prev) => [created, ...prev])
    return created
  }

  async function editPlant(
    id: string,
    updates: Partial<Omit<Plant, 'id' | 'user_id' | 'book_id' | 'created_at'>>
  ) {
    const updated = await updatePlant(id, updates)
    setPlants((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  async function waterPlant(input: {
    plantId: string
    bookId: string
    content: string
    pageNumber?: number
  }): Promise<{ plant: Plant; quote: Quote } | null> {
    if (!userId) {
      setError(new Error('User not authenticated'))
      return null
    }
    try {
      const result = await waterPlantLib({ ...input, userId })
      setPlants((prev) =>
        prev.map((p) => (p.id === input.plantId ? result.plant : p))
      )
      return result
    } catch (e) {
      setError(e as Error)
      return null
    }
  }

  return { plants, loading, error, refresh, addPlant, editPlant, waterPlant }
}
