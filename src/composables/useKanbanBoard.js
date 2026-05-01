import { reactive, computed } from 'vue'
import { StateMachine, createDefaultStateMachine } from './stateMachine'
import { WipLimiter, createDefaultWipLimiter } from './wipLimiter'
import { DependencyChecker } from './dependencyChecker'

export function useKanbanBoard(initialConfig = {}) {
  const state = reactive({
    columns: initialConfig.columns || [
      { id: 'todo', name: '待办', order: 1 },
      { id: 'in-progress', name: '进行中', order: 2 },
      { id: 'review', name: '审查', order: 3 },
      { id: 'done', name: '完成', order: 4 }
    ],
    cards: initialConfig.cards || [],
    transitions: initialConfig.transitions || {
      'todo': ['in-progress'],
      'in-progress': ['todo', 'review', 'done'],
      'review': ['in-progress', 'done'],
      'done': []
    },
    wipLimits: initialConfig.wipLimits || {
      'todo': null,
      'in-progress': 3,
      'review': 2,
      'done': null
    }
  })

  const stateMachine = computed(() => new StateMachine(state.transitions))
  const wipLimiter = computed(() => new WipLimiter(state.wipLimits))
  const dependencyChecker = computed(() => {
    const checker = new DependencyChecker()
    checker.setCards(state.cards)
    return checker
  })

  const columnsWithCards = computed(() => {
    return state.columns
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(col => ({
        ...col,
        cards: state.cards.filter(card => card.columnId === col.id),
        wipLimit: state.wipLimits[col.id],
        isOverWipLimit: wipLimiter.value.isOverLimit(col.id, getCardsByColumn(col.id).length)
      }))
  })

  function getCardsByColumn(columnId) {
    return state.cards.filter(card => card.columnId === columnId)
  }

  function getColumnById(columnId) {
    return state.columns.find(col => col.id === columnId)
  }

  function getCardById(cardId) {
    return state.cards.find(card => card.id === cardId)
  }

  function canMoveCard(cardId, targetColumnId) {
    const card = getCardById(cardId)
    if (!card) {
      return { allowed: false, reason: '卡片不存在' }
    }

    const sourceColumnId = card.columnId
    if (sourceColumnId === targetColumnId) {
      return { allowed: false, reason: '卡片已在目标列' }
    }

    const transitionResult = stateMachine.value.canTransition(sourceColumnId, targetColumnId)
    if (!transitionResult.allowed) {
      return transitionResult
    }

    const targetCards = getCardsByColumn(targetColumnId)
    const wipResult = wipLimiter.value.canAddCard(targetColumnId, targetCards.length)
    if (!wipResult.allowed) {
      return wipResult
    }

    const depResult = dependencyChecker.value.canMoveCard(cardId, targetColumnId)
    if (!depResult.allowed) {
      return depResult
    }

    return { allowed: true }
  }

  function moveCard(cardId, targetColumnId) {
    const result = canMoveCard(cardId, targetColumnId)
    if (!result.allowed) {
      return result
    }

    const card = getCardById(cardId)
    if (card) {
      card.columnId = targetColumnId
    }

    return { allowed: true }
  }

  function isValidColumn(columnId) {
    return state.columns.some(col => col.id === columnId)
  }

  function addCard(card) {
    const columnId = (card.columnId === undefined || card.columnId === null) ? 'todo' : card.columnId
    
    if (!isValidColumn(columnId)) {
      const validColumnIds = state.columns.map(col => col.id).join(', ')
      return { 
        allowed: false, 
        reason: `无效的列 ID: ${columnId}。有效的列 ID 为: ${validColumnIds}` 
      }
    }

    const columnCards = getCardsByColumn(columnId)
    
    const wipResult = wipLimiter.value.canAddCard(columnId, columnCards.length)
    if (!wipResult.allowed) {
      return wipResult
    }

    const newCard = {
      id: card.id || `card-${Date.now()}`,
      title: card.title || '新卡片',
      columnId: columnId,
      dependencies: card.dependencies || []
    }

    state.cards.push(newCard)
    return { allowed: true, card: newCard }
  }

  function removeCard(cardId) {
    const index = state.cards.findIndex(card => card.id === cardId)
    if (index > -1) {
      state.cards.splice(index, 1)
      return { allowed: true }
    }
    return { allowed: false, reason: '卡片不存在' }
  }

  function updateTransitions(newTransitions) {
    state.transitions = { ...newTransitions }
    return { allowed: true }
  }

  function updateWipLimit(columnId, limit) {
    state.wipLimits[columnId] = limit
    return { allowed: true }
  }

  function getAvailableTransitions(cardId) {
    const card = getCardById(cardId)
    if (!card) return []
    
    const availableStates = stateMachine.value.getAvailableTransitions(card.columnId)
    return availableStates.filter(targetId => {
      const result = canMoveCard(cardId, targetId)
      return result.allowed
    })
  }

  function getBlockingCards(cardId) {
    return dependencyChecker.value.getBlockingCards(cardId)
  }

  return {
    state,
    columnsWithCards,
    getCardsByColumn,
    getColumnById,
    getCardById,
    canMoveCard,
    moveCard,
    addCard,
    removeCard,
    updateTransitions,
    updateWipLimit,
    getAvailableTransitions,
    getBlockingCards
  }
}