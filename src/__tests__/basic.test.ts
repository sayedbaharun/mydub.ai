import { describe, test, expect } from 'vitest'

describe('Basic Test Suite', () => {
  test('should pass basic math test', () => {
    expect(2 + 2).toBe(4)
  })

  test('should pass string test', () => {
    expect('hello').toBe('hello')
  })

  test('should pass array test', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3])
  })
})
