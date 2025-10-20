/**
 * Secure Storage Utility
 * Provides a safe wrapper around localStorage with error handling
 */

export class SecureStorage {
  /**
   * Get item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return null
    }
  }

  /**
   * Set item in localStorage
   */
  static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error)
    }
  }

  /**
   * Clear all localStorage items
   */
  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}
