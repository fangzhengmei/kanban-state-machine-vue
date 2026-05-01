import { describe, it, expect, beforeEach } from 'vitest'
import { useKanbanBoard } from '../useKanbanBoard'

describe('useKanbanBoard', () => {
  let board

  beforeEach(() => {
    board = useKanbanBoard()
  })

  describe('initial state', () => {
    it('should have default columns', () => {
      const columns = board.state.columns
      expect(columns.length).toBe(4)
      expect(columns.map(c => c.id)).toEqual(['todo', 'in-progress', 'review', 'done'])
    })

    it('should have no cards initially', () => {
      expect(board.state.cards.length).toBe(0)
    })

    it('should have default transitions', () => {
      expect(board.state.transitions['todo']).toEqual(['in-progress'])
      expect(board.state.transitions['in-progress']).toContain('review')
      expect(board.state.transitions['in-progress']).toContain('done')
    })

    it('should have default WIP limits', () => {
      expect(board.state.wipLimits['in-progress']).toBe(3)
      expect(board.state.wipLimits['review']).toBe(2)
    })
  })

  describe('columnsWithCards computed', () => {
    it('should return columns sorted by order', () => {
      const columns = board.columnsWithCards.value
      expect(columns[0].order).toBeLessThan(columns[1].order)
      expect(columns[1].order).toBeLessThan(columns[2].order)
    })

    it('should include cards for each column', () => {
      board.addCard({ id: '1', title: 'Card 1', columnId: 'todo' })
      board.addCard({ id: '2', title: 'Card 2', columnId: 'in-progress' })

      const columns = board.columnsWithCards.value
      const todoCol = columns.find(c => c.id === 'todo')
      const inProgressCol = columns.find(c => c.id === 'in-progress')

      expect(todoCol.cards.length).toBe(1)
      expect(inProgressCol.cards.length).toBe(1)
    })
  })

  describe('addCard', () => {
    it('should add a card successfully', () => {
      const result = board.addCard({ id: '1', title: 'Test Card', columnId: 'todo' })
      
      expect(result.allowed).toBe(true)
      expect(board.state.cards.length).toBe(1)
      expect(board.getCardById('1')).toBeDefined()
    })

    it('should default column to todo if not specified', () => {
      const result = board.addCard({ id: '1', title: 'Test Card' })
      expect(result.allowed).toBe(true)
      expect(board.getCardById('1').columnId).toBe('todo')
    })

    it('should generate id if not provided', () => {
      const result = board.addCard({ title: 'Test Card' })
      expect(result.allowed).toBe(true)
      expect(result.card.id).toBeDefined()
    })

    it('should respect WIP limits', () => {
      board.updateWipLimit('todo', 1)
      
      const result1 = board.addCard({ id: '1', title: 'Card 1', columnId: 'todo' })
      expect(result1.allowed).toBe(true)

      const result2 = board.addCard({ id: '2', title: 'Card 2', columnId: 'todo' })
      expect(result2.allowed).toBe(false)
      expect(result2.reason).toContain('WIP 上限')
    })

    describe('column validation', () => {
      it('should reject card with invalid columnId', () => {
        const result = board.addCard({ id: '1', title: 'Invalid Card', columnId: 'non-existent-column' })
        
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('无效的列 ID')
        expect(result.reason).toContain('non-existent-column')
        expect(board.state.cards.length).toBe(0)
      })

      it('should reject card with empty string columnId', () => {
        const result = board.addCard({ id: '1', title: 'Invalid Card', columnId: '' })
        
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('无效的列 ID')
        expect(board.state.cards.length).toBe(0)
      })

      it('should reject card with null columnId (but should use default todo instead of null)', () => {
        const result = board.addCard({ id: '1', title: 'Card', columnId: null })
        
        expect(result.allowed).toBe(true)
        expect(board.getCardById('1').columnId).toBe('todo')
      })

      it('should reject card with undefined columnId (but should use default todo)', () => {
        const result = board.addCard({ id: '1', title: 'Card', columnId: undefined })
        
        expect(result.allowed).toBe(true)
        expect(board.getCardById('1').columnId).toBe('todo')
      })

      it('should accept card with all valid column IDs', () => {
        const validColumns = ['todo', 'in-progress', 'review', 'done']
        
        validColumns.forEach((colId, index) => {
          const result = board.addCard({ 
            id: `card-${index}`, 
            title: `Card in ${colId}`, 
            columnId: colId 
          })
          expect(result.allowed).toBe(true)
          expect(board.getCardById(`card-${index}`).columnId).toBe(colId)
        })
      })

      it('should show valid column IDs in error message', () => {
        const result = board.addCard({ id: '1', title: 'Invalid Card', columnId: 'invalid' })
        
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('有效的列 ID 为')
        expect(result.reason).toContain('todo')
        expect(result.reason).toContain('in-progress')
        expect(result.reason).toContain('review')
        expect(result.reason).toContain('done')
      })
    })
  })

  describe('removeCard', () => {
    it('should remove existing card', () => {
      board.addCard({ id: '1', title: 'Test Card' })
      expect(board.state.cards.length).toBe(1)

      const result = board.removeCard('1')
      expect(result.allowed).toBe(true)
      expect(board.state.cards.length).toBe(0)
    })

    it('should return error for non-existent card', () => {
      const result = board.removeCard('nonexistent')
      expect(result.allowed).toBe(false)
    })
  })

  describe('state machine transitions', () => {
    beforeEach(() => {
      board.addCard({ id: '1', title: 'Test Card', columnId: 'todo' })
    })

    it('should allow valid transition', () => {
      const result = board.canMoveCard('1', 'in-progress')
      expect(result.allowed).toBe(true)
    })

    it('should not allow invalid transition', () => {
      const result = board.canMoveCard('1', 'done')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('不允许从')
    })

    it('should not allow transition to same column', () => {
      const result = board.canMoveCard('1', 'todo')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('卡片已在目标列')
    })
  })

  describe('WIP limits during move', () => {
    beforeEach(() => {
      board.updateWipLimit('in-progress', 2)
    })

    it('should allow move when under WIP limit', () => {
      board.addCard({ id: '1', title: 'Card 1', columnId: 'todo' })
      board.addCard({ id: '2', title: 'Card 2', columnId: 'in-progress' })

      const result = board.canMoveCard('1', 'in-progress')
      expect(result.allowed).toBe(true)
    })

    it('should not allow move when at WIP limit', () => {
      board.addCard({ id: '1', title: 'Card 1', columnId: 'todo' })
      board.addCard({ id: '2', title: 'Card 2', columnId: 'in-progress' })
      board.addCard({ id: '3', title: 'Card 3', columnId: 'in-progress' })

      const result = board.canMoveCard('1', 'in-progress')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('WIP 上限')
    })
  })

  describe('dependency constraints during move', () => {
    beforeEach(() => {
      board.addCard({ id: 'dep1', title: 'Dependency 1', columnId: 'done' })
      board.addCard({ id: 'dep2', title: 'Dependency 2', columnId: 'in-progress' })
    })

    it('should allow move when all dependencies are done', () => {
      board.addCard({ 
        id: 'card', 
        title: 'Test Card', 
        columnId: 'todo',
        dependencies: ['dep1']
      })

      const result = board.canMoveCard('card', 'in-progress')
      expect(result.allowed).toBe(true)
    })

    it('should not allow move when dependencies are not done', () => {
      board.addCard({ 
        id: 'card', 
        title: 'Test Card', 
        columnId: 'todo',
        dependencies: ['dep2']
      })

      const result = board.canMoveCard('card', 'in-progress')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Dependency 2')
    })

    it('should not allow move when some dependencies are not done', () => {
      board.addCard({ 
        id: 'card', 
        title: 'Test Card', 
        columnId: 'todo',
        dependencies: ['dep1', 'dep2']
      })

      const result = board.canMoveCard('card', 'in-progress')
      expect(result.allowed).toBe(false)
    })
  })

  describe('moveCard', () => {
    it('should move card when all constraints are met', () => {
      board.addCard({ id: '1', title: 'Test Card', columnId: 'todo' })
      
      const result = board.moveCard('1', 'in-progress')
      expect(result.allowed).toBe(true)
      expect(board.getCardById('1').columnId).toBe('in-progress')
    })

    it('should not move card when constraints are violated', () => {
      board.addCard({ id: '1', title: 'Test Card', columnId: 'todo' })
      
      const result = board.moveCard('1', 'done')
      expect(result.allowed).toBe(false)
      expect(board.getCardById('1').columnId).toBe('todo')
    })
  })

  describe('getAvailableTransitions', () => {
    it('should return only transitions that pass all constraints', () => {
      board.updateWipLimit('in-progress', 0)
      board.addCard({ id: '1', title: 'Test Card', columnId: 'todo' })
      
      const transitions = board.getAvailableTransitions('1')
      expect(transitions).toEqual([])
    })

    it('should return valid transitions when constraints are met', () => {
      board.addCard({ id: '1', title: 'Test Card', columnId: 'todo' })
      
      const transitions = board.getAvailableTransitions('1')
      expect(transitions).toEqual(['in-progress'])
    })
  })

  describe('getBlockingCards', () => {
    it('should return blocking cards', () => {
      board.addCard({ id: 'dep', title: 'Dependency', columnId: 'in-progress' })
      board.addCard({ 
        id: 'card', 
        title: 'Test Card', 
        columnId: 'todo',
        dependencies: ['dep']
      })
      
      const blockers = board.getBlockingCards('card')
      expect(blockers.length).toBe(1)
      expect(blockers[0].id).toBe('dep')
    })
  })

  describe('integration: all three features', () => {
    it('should respect all three constraints together', () => {
      board.addCard({ id: 'dep', title: 'Dependency', columnId: 'in-progress' })
      board.updateWipLimit('in-progress', 0)
      
      board.addCard({ 
        id: 'card', 
        title: 'Test Card', 
        columnId: 'todo',
        dependencies: ['dep']
      })

      const result = board.canMoveCard('card', 'in-progress')
      expect(result.allowed).toBe(false)
    })

    it('should allow move only when all constraints are satisfied', () => {
      board.addCard({ id: 'dep', title: 'Dependency', columnId: 'done' })
      board.updateWipLimit('in-progress', 1)
      
      board.addCard({ 
        id: 'card', 
        title: 'Test Card', 
        columnId: 'todo',
        dependencies: ['dep']
      })

      const result = board.moveCard('card', 'in-progress')
      expect(result.allowed).toBe(true)
      expect(board.getCardById('card').columnId).toBe('in-progress')
    })
  })
})