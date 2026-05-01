export class StateMachine {
  constructor(transitions) {
    this.transitions = transitions || {}
  }

  canTransition(fromState, toState) {
    if (fromState === toState) {
      return { allowed: false, reason: '源状态和目标状态相同' }
    }

    const allowedTransitions = this.transitions[fromState]
    if (!allowedTransitions) {
      return { allowed: false, reason: `状态 ${fromState} 没有配置任何转移规则` }
    }

    if (!allowedTransitions.includes(toState)) {
      return { allowed: false, reason: `不允许从 ${fromState} 转移到 ${toState}` }
    }

    return { allowed: true }
  }

  getAvailableTransitions(fromState) {
    return this.transitions[fromState] || []
  }

  getAllStates() {
    return Object.keys(this.transitions)
  }
}

export function createDefaultStateMachine() {
  return new StateMachine({
    'todo': ['in-progress'],
    'in-progress': ['todo', 'review', 'done'],
    'review': ['in-progress', 'done'],
    'done': []
  })
}