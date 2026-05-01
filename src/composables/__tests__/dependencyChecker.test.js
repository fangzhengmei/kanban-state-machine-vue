import { describe, it, expect, beforeEach } from 'vitest'
import { DependencyChecker } from '../dependencyChecker'

describe('DependencyChecker', () => {
  describe('constructor', () => {
    it('should create empty checker when no cards provided', () => {
      const checker = new DependencyChecker()
      expect(checker.cards).toEqual([])
    })

    it('should create checker with provided cards', () => {
      const cards = [
        { id: '1', title: 'Card 1', columnId: 'todo' }
      ]
      const checker = new DependencyChecker(cards)
      expect(checker.cards).toEqual(cards)
    })
  })

  describe('setCards', () => {
    it('should update cards array', () => {
      const checker = new DependencyChecker()
      const newCards = [
        { id: '1', title: 'Card 1', columnId: 'todo' }
      ]
      checker.setCards(newCards)
      expect(checker.cards).toEqual(newCards)
    })
  })

  describe('getCard', () => {
    let checker

    beforeEach(() => {
      checker = new DependencyChecker([
        { id: '1', title: 'Card 1', columnId: 'todo' },
        { id: '2', title: 'Card 2', columnId: 'in-progress' }
      ])
    })

    it('should return card by id', () => {
      const card = checker.getCard('1')
      expect(card).toBeDefined()
      expect(card.id).toBe('1')
      expect(card.title).toBe('Card 1')
    })

    it('should return undefined for nonexistent card', () => {
      const card = checker.getCard('nonexistent')
      expect(card).toBeUndefined()
    })
  })

  describe('areDependenciesMet', () => {
    describe('when card has no dependencies', () => {
      let checker

      beforeEach(() => {
        checker = new DependencyChecker([
          { id: '1', title: 'Card 1', columnId: 'todo', dependencies: [] }
        ])
      })

      it('should return allowed for any target', () => {
        const result = checker.areDependenciesMet('1', 'in-progress')
        expect(result.allowed).toBe(true)
      })

      it('should return allowed even when dependencies property is undefined', () => {
        const checker2 = new DependencyChecker([
          { id: '1', title: 'Card 1', columnId: 'todo' }
        ])
        const result = checker2.areDependenciesMet('1', 'in-progress')
        expect(result.allowed).toBe(true)
      })
    })

    describe('when card has dependencies', () => {
      let checker

      beforeEach(() => {
        checker = new DependencyChecker([
          { id: '1', title: 'Dependency 1', columnId: 'done', dependencies: [] },
          { id: '2', title: 'Dependency 2', columnId: 'in-progress', dependencies: [] },
          { id: '3', title: 'Dependent Card', columnId: 'todo', dependencies: ['1', '2'] }
        ])
      })

      it('should return not allowed when any dependency is not done', () => {
        const result = checker.areDependenciesMet('3', 'in-progress')
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('Dependency 2')
      })

      it('should return allowed when all dependencies are done', () => {
        const updatedCards = [
          { id: '1', title: 'Dependency 1', columnId: 'done', dependencies: [] },
          { id: '2', title: 'Dependency 2', columnId: 'done', dependencies: [] },
          { id: '3', title: 'Dependent Card', columnId: 'todo', dependencies: ['1', '2'] }
        ]
        checker.setCards(updatedCards)
        const result = checker.areDependenciesMet('3', 'in-progress')
        expect(result.allowed).toBe(true)
      })

      it('should return not allowed when dependency does not exist', () => {
        checker.setCards([
          { id: '3', title: 'Dependent Card', columnId: 'todo', dependencies: ['nonexistent'] }
        ])
        const result = checker.areDependenciesMet('3', 'in-progress')
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('nonexistent')
      })
    })

    it('should return not allowed when card does not exist', () => {
      const checker = new DependencyChecker()
      const result = checker.areDependenciesMet('nonexistent', 'in-progress')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('卡片不存在')
    })
  })

  describe('isCardCompleted', () => {
    let checker

    beforeEach(() => {
      checker = new DependencyChecker()
    })

    it('should return true when card is in done column', () => {
      const card = { id: '1', columnId: 'done' }
      expect(checker.isCardCompleted(card)).toBe(true)
    })

    it('should return false when card is in other columns', () => {
      expect(checker.isCardCompleted({ id: '1', columnId: 'todo' })).toBe(false)
      expect(checker.isCardCompleted({ id: '1', columnId: 'in-progress' })).toBe(false)
      expect(checker.isCardCompleted({ id: '1', columnId: 'review' })).toBe(false)
    })
  })

  describe('getBlockingCards', () => {
    it('should return cards that are blocking the given card', () => {
      const checker = new DependencyChecker([
        { id: '1', title: 'Blocker 1', columnId: 'in-progress', dependencies: [] },
        { id: '2', title: 'Blocker 2', columnId: 'done', dependencies: [] },
        { id: '3', title: 'Blocked Card', columnId: 'todo', dependencies: ['1', '2'] }
      ])

      const blockers = checker.getBlockingCards('3')
      expect(blockers.length).toBe(1)
      expect(blockers[0].id).toBe('1')
      expect(blockers[0].title).toBe('Blocker 1')
    })

    it('should return empty array when no blockers', () => {
      const checker = new DependencyChecker([
        { id: '1', title: 'Blocker 1', columnId: 'done', dependencies: [] },
        { id: '2', title: 'Card', columnId: 'todo', dependencies: ['1'] }
      ])

      const blockers = checker.getBlockingCards('2')
      expect(blockers).toEqual([])
    })

    it('should return empty array when card has no dependencies', () => {
      const checker = new DependencyChecker([
        { id: '1', title: 'Card', columnId: 'todo', dependencies: [] }
      ])
      expect(checker.getBlockingCards('1')).toEqual([])
    })

    it('should return empty array when card does not exist', () => {
      const checker = new DependencyChecker()
      expect(checker.getBlockingCards('nonexistent')).toEqual([])
    })
  })

  describe('getBlockedCards', () => {
    it('should return cards that are blocked by the given card', () => {
      const checker = new DependencyChecker([
        { id: '1', title: 'Blocker', columnId: 'in-progress', dependencies: [] },
        { id: '2', title: 'Blocked 1', columnId: 'todo', dependencies: ['1'] },
        { id: '3', title: 'Blocked 2', columnId: 'todo', dependencies: ['1'] },
        { id: '4', title: 'Not Blocked', columnId: 'todo', dependencies: [] }
      ])

      const blocked = checker.getBlockedCards('1')
      expect(blocked.length).toBe(2)
      expect(blocked.map(c => c.id)).toContain('2')
      expect(blocked.map(c => c.id)).toContain('3')
    })

    it('should return empty array when blocker is done', () => {
      const checker = new DependencyChecker([
        { id: '1', title: 'Blocker', columnId: 'done', dependencies: [] },
        { id: '2', title: 'Blocked', columnId: 'todo', dependencies: ['1'] }
      ])

      const blocked = checker.getBlockedCards('1')
      expect(blocked).toEqual([])
    })
  })

  describe('canMoveCard', () => {
    it('should delegate to areDependenciesMet', () => {
      const checker = new DependencyChecker([
        { id: '1', title: 'Card 1', columnId: 'todo', dependencies: [] }
      ])

      const result = checker.canMoveCard('1', 'in-progress')
      expect(result.allowed).toBe(true)
    })
  })
})