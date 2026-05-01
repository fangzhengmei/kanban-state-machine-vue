export class DependencyChecker {
  constructor(cards = []) {
    this.cards = cards
  }

  setCards(cards) {
    this.cards = cards
  }

  getCard(cardId) {
    return this.cards.find(card => card.id === cardId)
  }

  areDependenciesMet(cardId, targetColumnId) {
    const card = this.getCard(cardId)
    if (!card) {
      return { allowed: false, reason: '卡片不存在' }
    }

    if (!card.dependencies || card.dependencies.length === 0) {
      return { allowed: true }
    }

    const unmetDependencies = []
    for (const depId of card.dependencies) {
      const depCard = this.getCard(depId)
      if (!depCard) {
        unmetDependencies.push(depId)
        continue
      }
      if (!this.isCardCompleted(depCard)) {
        unmetDependencies.push(depCard.title || depId)
      }
    }

    if (unmetDependencies.length > 0) {
      return {
        allowed: false,
        reason: `前置依赖未完成: ${unmetDependencies.join(', ')}`
      }
    }

    return { allowed: true }
  }

  isCardCompleted(card) {
    return card.columnId === 'done'
  }

  getBlockingCards(cardId) {
    const card = this.getCard(cardId)
    if (!card || !card.dependencies) {
      return []
    }

    return card.dependencies
      .map(depId => this.getCard(depId))
      .filter(depCard => depCard && !this.isCardCompleted(depCard))
  }

  getBlockedCards(cardId) {
    const blockerCard = this.getCard(cardId)
    if (!blockerCard || this.isCardCompleted(blockerCard)) {
      return []
    }

    return this.cards.filter(card => 
      card.dependencies && 
      card.dependencies.includes(cardId)
    )
  }

  canMoveCard(cardId, targetColumnId) {
    const depResult = this.areDependenciesMet(cardId, targetColumnId)
    return depResult
  }
}