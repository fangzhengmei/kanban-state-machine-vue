export class WipLimiter {
  constructor(columnWipLimits) {
    this.columnWipLimits = columnWipLimits || {}
  }

  canAddCard(columnId, currentCardCount) {
    const limit = this.columnWipLimits[columnId]
    
    if (limit === undefined || limit === null || limit < 0) {
      return { allowed: true }
    }

    if (currentCardCount >= limit) {
      return { 
        allowed: false, 
        reason: `列 ${columnId} 已达到 WIP 上限 (${limit})` 
      }
    }

    return { allowed: true }
  }

  isOverLimit(columnId, currentCardCount) {
    const limit = this.columnWipLimits[columnId]
    if (limit === undefined || limit === null || limit < 0) {
      return false
    }
    return currentCardCount > limit
  }

  isAtLimit(columnId, currentCardCount) {
    const limit = this.columnWipLimits[columnId]
    if (limit === undefined || limit === null || limit < 0) {
      return false
    }
    return currentCardCount === limit
  }

  getLimit(columnId) {
    return this.columnWipLimits[columnId] || null
  }

  updateLimit(columnId, limit) {
    this.columnWipLimits[columnId] = limit
  }
}

export function createDefaultWipLimiter() {
  return new WipLimiter({
    'todo': null,
    'in-progress': 3,
    'review': 2,
    'done': null
  })
}