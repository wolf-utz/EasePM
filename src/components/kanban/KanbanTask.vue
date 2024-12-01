<script lang="ts" setup>
import { ref } from "vue";
import { Task } from "../../types/project-types";
import TaskForm from "../forms/TaskForm.vue";
import moment from "moment";
interface Props {
  task: Task;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "updateTask"): void;
}>();
const dialogOpen = ref<boolean>(false);

function onSilentSubmitTask() {
  props.task.updatedDateTime = moment().unix();
  emit("updateTask");
}
function onSubmitTask() {
  dialogOpen.value = false;
  onSilentSubmitTask();
}
</script>

<template>
  <q-card dark flat bordered class="q-mt-sm q-mb-sm">
    <q-item>
      <q-item-section>
        <q-item-label> {{ task.title }}</q-item-label>
      </q-item-section>

      <q-item-section avatar>
        <q-btn
          dark
          flat
          round
          icon="open_in_new"
          @click="() => (dialogOpen = !dialogOpen)"
        />
      </q-item-section>
    </q-item>
    <q-dialog v-model="dialogOpen" persistent backdrop-filter="blur(4px)">
      <q-card flat dark style="width: 100%; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 q-mr-sm">{{ task.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator dark />

        <q-card-section>
          <TaskForm
            :form-data="task"
            v-on:submit="onSubmitTask"
            v-on:silent-submit="onSilentSubmitTask"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-card>
</template>
