<script lang="ts" setup>
import { ref, watch } from "vue";
import { Task, TaskState } from "../../types/project-types";
import draggable from "vuedraggable";
import KanbanTask from "./KanbanTask.vue";

interface Props {
  group: string;
  state: TaskState;
  tasks: Task[];
  animationTime: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "taskMoved"): void;
  (e: "taskUpdated"): void;
  (e: "update:tasks", tasks: Task[]): void;
}>();
const localTasks = ref<Task[]>(props.tasks);

function onTaskMoved(): void {
  emit("taskMoved");
}
function onTaskUpdated(): void {
  emit("taskUpdated");
}

watch(
  () => props.tasks,
  (newTasks) => {
    localTasks.value = newTasks;
  }
);
watch(localTasks, (newTasks) => {
  emit("update:tasks", newTasks);
});
</script>

<template>
  <q-card dark flat bordered class="full-height">
    <q-card-section>
      <div class="text-h6 text-center">{{ state }} ({{ tasks.length }})</div>
    </q-card-section>
    <q-separator dark />

    <q-card-section>
      <draggable
        class="q-pt-none drop-zone"
        v-model="localTasks"
        tag="div"
        itemKey="taskNumber"
        :group="group"
        :animation="animationTime"
        @end="onTaskMoved"
      >
        <template #item="{ element: task }">
          <KanbanTask :task="task" v-on:updateTask="onTaskUpdated" />
        </template>
      </draggable>
    </q-card-section>
  </q-card>
</template>

<style>
.full-height {
  height: 100%;
}
.drop-zone {
  min-height: 300px;
  /* outline: 1px solid var(--q-primary); */
}
</style>
