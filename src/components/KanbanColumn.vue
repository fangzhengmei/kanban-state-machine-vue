<template>
  <div class="kanban-column" :data-column-id="column.id">
    <div class="column-header">
      <span class="column-title">{{ column.name }}</span>
      <span 
        class="column-wip"
        :class="{ warning: isOverWipLimit }"
      >
        {{ column.cards.length }}{{ column.wipLimit ? ` / ${column.wipLimit}` : '' }}
      </span>
    </div>
    <div class="column-cards">
      <KanbanCard
        v-for="card in column.cards"
        :key="card.id"
        :card="card"
        :is-movable="isCardMovable(card.id)"
        :available-transitions="getCardTransitions(card.id)"
        :blocking-cards="getBlockingCards(card.id)"
        @select="handleCardSelect"
      />
    </div>
  </div>
</template>

<script>
import KanbanCard from './KanbanCard.vue'

export default {
  name: 'KanbanColumn',
  components: {
    KanbanCard
  },
  props: {
    column: {
      type: Object,
      required: true
    },
    isOverWipLimit: {
      type: Boolean,
      default: false
    },
    isCardMovable: {
      type: Function,
      required: true
    },
    getCardTransitions: {
      type: Function,
      required: true
    },
    getBlockingCards: {
      type: Function,
      required: true
    }
  },
  emits: ['card-select'],
  methods: {
    handleCardSelect(card) {
      this.$emit('card-select', card)
    }
  }
}
</script>