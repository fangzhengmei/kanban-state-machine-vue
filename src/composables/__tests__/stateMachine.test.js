import { describe, it, expect } from 'vitest'
import { StateMachine, createDefaultStateMachine } from '../stateMachine'

describe('StateMachine', () => {
  describe('constructor', () => {
    it('should create an empty state machine when no transitions provided', () => {
      const machine = new StateMachine()
      expect(machine.transitions).toEqual({})
    })

    it('should create state machine with provided transitions', () => {
      const transitions = {
        'a': ['b'],
        'b': ['c'],
        'c': []
      }
      const machine = new StateMachine(transitions)
      expect(machine.transitions).toEqual(transitions)
    })
  })

  describe('canTransition', () => {
    let machine

    beforeEach(() => {
      machine = new StateMachine({
        'todo': ['in-progress'],
        'in-progress': ['todo', 'review', 'done'],
        'review': ['in-progress', 'done'],
        'done': []
      })
    })

    it('should not allow transition to the same state', () => {
      const result = machine.canTransition('todo', 'todo')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('源状态和目标状态相同')
    })

    it('should not allow transition from state with no transitions', () => {
      const result = machine.canTransition('done', 'todo')
      expect(result.allowed).toBe(false)
    })

    it('should not allow transition that is not defined', () => {
      const result = machine.canTransition('todo', 'review')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('不允许从')
    })

    it('should allow valid transition', () => {
      const result = machine.canTransition('todo', 'in-progress')
      expect(result.allowed).toBe(true)
    })

    it('should allow transition back to previous state', () => {
      const result = machine.canTransition('in-progress', 'todo')
      expect(result.allowed).toBe(true)
    })

    it('should not allow transition from undefined state', () => {
      const result = machine.canTransition('nonexistent', 'todo')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('没有配置任何转移规则')
    })
  })

  describe('getAvailableTransitions', () => {
    it('should return available transitions for a state', () => {
      const machine = new StateMachine({
        'a': ['b', 'c'],
        'b': ['a'],
        'c': []
      })
      expect(machine.getAvailableTransitions('a')).toEqual(['b', 'c'])
      expect(machine.getAvailableTransitions('b')).toEqual(['a'])
      expect(machine.getAvailableTransitions('c')).toEqual([])
    })

    it('should return empty array for undefined state', () => {
      const machine = new StateMachine({ 'a': ['b'] })
      expect(machine.getAvailableTransitions('nonexistent')).toEqual([])
    })
  })

  describe('getAllStates', () => {
    it('should return all defined states', () => {
      const machine = new StateMachine({
        'todo': ['in-progress'],
        'in-progress': ['done'],
        'done': []
      })
      expect(machine.getAllStates()).toEqual(['todo', 'in-progress', 'done'])
    })

    it('should return empty array for empty machine', () => {
      const machine = new StateMachine()
      expect(machine.getAllStates()).toEqual([])
    })
  })

  describe('createDefaultStateMachine', () => {
    it('should create a default kanban state machine', () => {
      const machine = createDefaultStateMachine()
      expect(machine.getAllStates()).toEqual(['todo', 'in-progress', 'review', 'done'])
      expect(machine.getAvailableTransitions('todo')).toEqual(['in-progress'])
      expect(machine.getAvailableTransitions('in-progress')).toContain('review')
      expect(machine.getAvailableTransitions('in-progress')).toContain('done')
      expect(machine.getAvailableTransitions('done')).toEqual([])
    })
  })
})