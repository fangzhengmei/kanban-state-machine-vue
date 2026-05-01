import { describe, it, expect } from 'vitest'
import { WipLimiter, createDefaultWipLimiter } from '../wipLimiter'

describe('WipLimiter', () => {
  describe('constructor', () => {
    it('should create an empty WIP limiter when no limits provided', () => {
      const limiter = new WipLimiter()
      expect(limiter.columnWipLimits).toEqual({})
    })

    it('should create WIP limiter with provided limits', () => {
      const limits = { 'col1': 3, 'col2': 5 }
      const limiter = new WipLimiter(limits)
      expect(limiter.columnWipLimits).toEqual(limits)
    })
  })

  describe('canAddCard', () => {
    let limiter

    beforeEach(() => {
      limiter = new WipLimiter({
        'limited': 2,
        'unlimited': null,
        'zero': 0,
        'negative': -1
      })
    })

    it('should allow adding card when under limit', () => {
      const result = limiter.canAddCard('limited', 1)
      expect(result.allowed).toBe(true)
    })

    it('should allow adding card when at 0 but limit is not set', () => {
      const result = limiter.canAddCard('unlimited', 0)
      expect(result.allowed).toBe(true)
    })

    it('should allow adding card when column has no limit defined', () => {
      const result = limiter.canAddCard('undefined-column', 100)
      expect(result.allowed).toBe(true)
    })

    it('should not allow adding card when at limit', () => {
      const result = limiter.canAddCard('limited', 2)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('已达到 WIP 上限')
    })

    it('should not allow adding card when over limit', () => {
      const result = limiter.canAddCard('limited', 3)
      expect(result.allowed).toBe(false)
    })

    it('should treat null limit as unlimited', () => {
      const result = limiter.canAddCard('unlimited', 1000)
      expect(result.allowed).toBe(true)
    })

    it('should treat zero limit as 0 cards allowed', () => {
      const result = limiter.canAddCard('zero', 0)
      expect(result.allowed).toBe(false)
    })

    it('should treat negative limit as unlimited', () => {
      const result = limiter.canAddCard('negative', 5)
      expect(result.allowed).toBe(true)
    })
  })

  describe('isOverLimit', () => {
    let limiter

    beforeEach(() => {
      limiter = new WipLimiter({
        'col1': 2,
        'unlimited': null
      })
    })

    it('should return true when count exceeds limit', () => {
      expect(limiter.isOverLimit('col1', 3)).toBe(true)
      expect(limiter.isOverLimit('col1', 100)).toBe(true)
    })

    it('should return false when count equals limit', () => {
      expect(limiter.isOverLimit('col1', 2)).toBe(false)
    })

    it('should return false when count is under limit', () => {
      expect(limiter.isOverLimit('col1', 1)).toBe(false)
      expect(limiter.isOverLimit('col1', 0)).toBe(false)
    })

    it('should return false for unlimited column', () => {
      expect(limiter.isOverLimit('unlimited', 1000)).toBe(false)
    })

    it('should return false for undefined column', () => {
      expect(limiter.isOverLimit('nonexistent', 1000)).toBe(false)
    })
  })

  describe('isAtLimit', () => {
    let limiter

    beforeEach(() => {
      limiter = new WipLimiter({
        'col1': 2,
        'unlimited': null
      })
    })

    it('should return true when count equals limit', () => {
      expect(limiter.isAtLimit('col1', 2)).toBe(true)
    })

    it('should return false when count under limit', () => {
      expect(limiter.isAtLimit('col1', 1)).toBe(false)
    })

    it('should return false when count over limit', () => {
      expect(limiter.isAtLimit('col1', 3)).toBe(false)
    })

    it('should return false for unlimited column', () => {
      expect(limiter.isAtLimit('unlimited', 1000)).toBe(false)
    })

    it('should return false for undefined column', () => {
      expect(limiter.isAtLimit('nonexistent', 1000)).toBe(false)
    })
  })

  describe('getLimit', () => {
    let limiter

    beforeEach(() => {
      limiter = new WipLimiter({
        'col1': 3,
        'col2': null
      })
    })

    it('should return the limit for existing column', () => {
      expect(limiter.getLimit('col1')).toBe(3)
      expect(limiter.getLimit('col2')).toBe(null)
    })

    it('should return null for undefined column', () => {
      expect(limiter.getLimit('nonexistent')).toBe(null)
    })
  })

  describe('updateLimit', () => {
    it('should update existing limit', () => {
      const limiter = new WipLimiter({ 'col1': 2 })
      limiter.updateLimit('col1', 5)
      expect(limiter.getLimit('col1')).toBe(5)
    })

    it('should add new limit', () => {
      const limiter = new WipLimiter()
      limiter.updateLimit('new-col', 10)
      expect(limiter.getLimit('new-col')).toBe(10)
    })
  })

  describe('createDefaultWipLimiter', () => {
    it('should create a default WIP limiter for kanban columns', () => {
      const limiter = createDefaultWipLimiter()
      expect(limiter.getLimit('todo')).toBe(null)
      expect(limiter.getLimit('in-progress')).toBe(3)
      expect(limiter.getLimit('review')).toBe(2)
      expect(limiter.getLimit('done')).toBe(null)
    })
  })
})