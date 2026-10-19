<template>
  <div class="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 text-xs text-slate-500">
    <div class="flex items-center gap-2">
      <span>Hiển thị</span>
      <select
        :value="pageSize"
        @change="$emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
        class="border border-slate-200 rounded-lg px-2 py-1 outline-none bg-slate-50 font-medium text-slate-700 cursor-pointer"
      >
        <option :value="10">10 / trang</option>
        <option :value="20">20 / trang</option>
        <option :value="50">50 / trang</option>
        <option :value="100">100 / trang</option>
      </select>
      <span class="text-slate-400">| Tổng số <strong class="text-slate-700">{{ totalItems }}</strong> mục</span>
    </div>

    <!-- Pagination buttons -->
    <div class="flex items-center gap-1.5">
      <button
        @click="$emit('update:currentPage', currentPage - 1)"
        :disabled="currentPage <= 1"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        title="Trang trước"
      >
        ‹ Trước
      </button>

      <span class="px-3 py-1 font-semibold text-slate-800 bg-sky-50 rounded-lg border border-sky-100">
        {{ currentPage }} / {{ totalPages || 1 }}
      </span>

      <button
        @click="$emit('update:currentPage', currentPage + 1)"
        :disabled="currentPage >= totalPages"
        class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        title="Trang sau"
      >
        Sau ›
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  pageSize: number
  totalItems: number
}>()

defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
}>()

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.pageSize) || 1
})
</script>
