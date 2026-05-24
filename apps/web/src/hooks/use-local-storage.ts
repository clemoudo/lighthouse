"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Custom hook to sync state with localStorage.
 * SSR safe.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Initialize state with a function to prevent redundant reading from localStorage
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // 2. Load the initial value from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  // 3. Setter function to update state and localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue] as const
}
