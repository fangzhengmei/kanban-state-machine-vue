<template>
  <div 
    class="kanban-card"
    :class="{ disabled: !isMovable }"
    @click="handleClick"
  >
    <div class="card-title">{{ card.title }}</div>
    <div class="card-meta">
      <span>ID: {{ card.id }}</span>
      <span v-if="availableTransitions.length > 0">
        可移动
      </span>
      <span v-else-if="!isMovable" class="card-meta-blocked">
        已锁定
      </span>
    </div>
    <div v-if="blockingCards.length > 0" class="card-dependencies">
      <span class="card-dependency-icon">🔗</span>
      等待: {{ blockingCards.map(c => c.title).join(', ') }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'KanbanCard',
  props: {
    card: {
      type: Object,
      required: true
    },
    isMovable: {
      type: Boolean,
      default: true
    },
    availableTransitions: {
      type: Array,
      default: () => []
    },
    blockingCards: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select'],
  methods: {
    handleClick() {
      if (this.isMovable) {
        this.$emit('select', this.card)
      }
    }
  }
}
</script>