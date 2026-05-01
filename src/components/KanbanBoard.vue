<template>
  <div>
    <div class="controls">
      <h2>看板状态机演示</h2>
      <button class="btn btn-secondary" @click="addTestCard">
        添加测试卡片
      </button>
      <button v-if="selectedCard" class="btn btn-secondary" @click="clearSelection">
        取消选择
      </button>
    </div>

    <div v-if="selectedCard" class="controls">
      <span>已选择: {{ selectedCard.title }}</span>
      <span>可移动到:</span>
      <button
        v-for="col in availableTargetColumns"
        :key="col.id"
        class="btn btn-primary"
        @click="moveCardToColumn(col.id)"
      >
        {{ col.name }}
      </button>
    </div>

    <div v-if="lastError" class="error-message">
      ❌ {{ lastError }}
    </div>

    <div v-if="lastSuccess" class="success-message">
      ✅ {{ lastSuccess }}
    </div>

    <div class="kanban-board">
      <KanbanColumn
        v-for="column in board.columnsWithCards"
        :key="column.id"
        :column="column"
        :is-over-wip-limit="column.isOverWipLimit"
        :is-card-movable="isCardMovable"
        :get-card-transitions="getCardTransitions"
        :get-blocking-cards="getBlockingCards"
        @card-select="handleCardSelect"
      />
    </div>

    <div class="status-bar">
      <h4>规则说明:</h4>
      <p><strong>状态转移规则:</strong> 待办 → 进行中 → 审查 → 完成 (可回退)</p>
      <p><strong>WIP 限制:</strong> 进行中最多3张, 审查最多2张</p>
      <p><strong>依赖规则:</strong> 卡片必须等前置依赖卡片完成后才能移动</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import KanbanColumn from './KanbanColumn.vue'
import { useKanbanBoard } from '../composables/useKanbanBoard'

export default {
  name: 'KanbanBoard',
  components: {
    KanbanColumn
  },
  setup() {
    const board = useKanbanBoard({
      columns: [
        { id: 'todo', name: '待办', order: 1 },
        { id: 'in-progress', name: '进行中', order: 2 },
        { id: 'review', name: '审查', order: 3 },
        { id: 'done', name: '完成', order: 4 }
      ]
    })

    const selectedCard = ref(null)
    const lastError = ref('')
    const lastSuccess = ref('')
    let cardCounter = 0

    const availableTargetColumns = ref([])

    function clearMessages() {
      lastError.value = ''
      lastSuccess.value = ''
    }

    function isCardMovable(cardId) {
      const transitions = board.getAvailableTransitions(cardId)
      return transitions.length > 0
    }

    function getCardTransitions(cardId) {
      return board.getAvailableTransitions(cardId)
    }

    function getBlockingCards(cardId) {
      return board.getBlockingCards(cardId)
    }

    function handleCardSelect(card) {
      clearMessages()
      selectedCard.value = card
      const transitions = board.getAvailableTransitions(card.id)
      availableTargetColumns.value = transitions
        .map(id => board.getColumnById(id))
        .filter(col => col)
    }

    function clearSelection() {
      selectedCard.value = null
      availableTargetColumns.value = []
    }

    function moveCardToColumn(columnId) {
      if (!selectedCard.value) return
      
      clearMessages()
      const result = board.moveCard(selectedCard.value.id, columnId)
      
      if (result.allowed) {
        lastSuccess.value = `成功将卡片移动到 ${board.getColumnById(columnId)?.name || columnId}`
        clearSelection()
      } else {
        lastError.value = result.reason
      }
    }

    function addTestCard() {
      clearMessages()
      cardCounter++
      
      const columnId = 'todo'
      const result = board.addCard({
        id: `card-${cardCounter}`,
        title: `任务卡片 #${cardCounter}`,
        columnId: columnId,
        dependencies: cardCounter > 3 ? [`card-${cardCounter - 2}`] : []
      })

      if (result.allowed) {
        lastSuccess.value = `已添加卡片: ${result.card.title}`
        if (result.card.dependencies.length > 0) {
          lastSuccess.value += ` (依赖: ${result.card.dependencies.join(', ')})`
        }
      } else {
        lastError.value = result.reason
      }
    }

    return {
      board,
      selectedCard,
      availableTargetColumns,
      lastError,
      lastSuccess,
      isCardMovable,
      getCardTransitions,
      getBlockingCards,
      handleCardSelect,
      clearSelection,
      moveCardToColumn,
      addTestCard
    }
  }
}
</script>