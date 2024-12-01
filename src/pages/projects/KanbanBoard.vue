<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { Project, Task, TaskState } from "../../types/project-types";
import KanbanColumn from "../../components/kanban/KanbanColumn.vue";
import TaskForm from "../../components/forms/TaskForm.vue";
import generateTaskNumber from "../../util/tasknumber-generator";
import moment from "moment";
import { useQuasar } from "quasar";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const project = ref<Project | null>(null);
const { id } = defineProps({ id: String });
const loaded = ref(false);
const $q = useQuasar();

const tasksOpen = ref<Task[]>([]);
const tasksPaused = ref<Task[]>([]);
const tasksInProgess = ref<Task[]>([]);
const tasksDone = ref<Task[]>([]);
const animationTime = ref(150);
const newTaskDialogOpen = ref<boolean>(false);
const emptyTask: Task = {
  title: "",
  taskNumber: "",
  description: "",
  state: TaskState.OPEN,
  creationDateTime: 0,
  updatedDateTime: 0,
  workLogs: [],
};
const newTask = ref<Task>(JSON.parse(JSON.stringify(emptyTask)));
function onAddnewTask(): void {
  newTask.value = JSON.parse(JSON.stringify(emptyTask));

  newTaskDialogOpen.value = true;
}
async function onTaskMoved(): Promise<void> {
  await updateProject();
}
async function onTaskUpdated(): Promise<void> {
  await updateProject();
}
async function onSubmitNewTask(): Promise<void> {
  newTaskDialogOpen.value = false;
  if (!project.value) {
    console.error("Can not add new task: Project not loaded!");
    return;
  }
  const task = JSON.parse(JSON.stringify(newTask.value));
  const time = moment().unix();
  task.taskNumber = await generateTaskNumber(project.value);
  task.creationDateTime = time;
  task.updatedDateTime = time;
  project.value.taskAutoIncrement++;
  project.value.tasks.push(task);
  tasksOpen.value.push(task);
  await updateProject();
}
async function updateProject() {
  if (!project.value) {
    console.error("Can not update Project: Project not loaded!");
    return;
  }

  // Update task states.
  const taskStateMap = {
    [TaskState.OPEN]: tasksOpen.value,
    [TaskState.PAUSED]: tasksPaused.value,
    [TaskState.IN_PROGRESS]: tasksInProgess.value,
    [TaskState.DONE]: tasksDone.value,
  };
  for (const [state, tasks] of Object.entries(taskStateMap)) {
    for (const task of tasks) {
      task.state = state.toString();
    }
  }

  await ipcRenderer.invoke(
    "storeUpdate",
    "projectData",
    "projectData",
    id,
    JSON.parse(JSON.stringify(project.value))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 100,
    position: "top",
    message: "Your data has been updated successfully!",
  });
}
onMounted(async () => {
  project.value = (await ipcRenderer.invoke(
    "storeGetSingle",
    "projectData",
    "projectData",
    id
  )) as Project;

  if (project.value.tasks.length === 0) {
    loaded.value = true;

    return;
  }

  for (const task of project.value.tasks) {
    switch (task.state) {
      case TaskState.OPEN.toString():
        tasksOpen.value.push(task);
        break;
      case TaskState.PAUSED.toString():
        tasksPaused.value.push(task);
        break;
      case TaskState.IN_PROGRESS.toString():
        tasksInProgess.value.push(task);
        break;
      case TaskState.DONE.toString():
        tasksDone.value.push(task);
        break;
    }
  }

  loaded.value = true;
});
</script>

<template>
  <div v-if="loaded">
    <h1 class="text-h5">
      Kanban Project: <strong>{{ project?.title }}</strong>
    </h1>
    <div class="kanban">
      <div class="row">
        <div class="col-3 q-px-sm q-col">
          <KanbanColumn
            group="tasks"
            :state="TaskState.OPEN"
            :tasks="tasksOpen"
            :animation-time="animationTime"
            @task-moved="onTaskMoved"
            @task-updated="onTaskUpdated"
            v-on:update:tasks="(tasks: Task[]) => (tasksOpen = tasks)"
          />
        </div>
        <div class="col-3 q-px-sm q-col">
          <KanbanColumn
            group="tasks"
            :state="TaskState.PAUSED"
            :tasks="tasksPaused"
            :animation-time="animationTime"
            @task-moved="onTaskMoved"
            @task-updated="onTaskUpdated"
            v-on:update:tasks="(tasks: Task[]) => (tasksPaused = tasks)"
          />
        </div>
        <div class="col-3 q-px-sm q-col">
          <KanbanColumn
            group="tasks"
            :state="TaskState.IN_PROGRESS"
            :tasks="tasksInProgess"
            :animation-time="animationTime"
            @task-moved="onTaskMoved"
            @task-updated="onTaskUpdated"
            v-on:update:tasks="(tasks: Task[]) => (tasksInProgess = tasks)"
          />
        </div>
        <div class="col-3 q-px-sm q-col">
          <KanbanColumn
            group="tasks"
            :state="TaskState.DONE"
            :tasks="tasksDone"
            :animation-time="animationTime"
            @task-moved="onTaskMoved"
            @task-updated="onTaskUpdated"
            v-on:update:tasks="(tasks: Task[]) => (tasksDone = tasks)"
          />
        </div>
      </div>
    </div>
    <q-dialog
      v-model="newTaskDialogOpen"
      persistent
      backdrop-filter="blur(4px)"
    >
      <q-card flat dark>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 q-mr-sm">{{ newTask.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator dark />

        <q-card-section>
          <TaskForm :form-data="newTask" v-on:submit="onSubmitNewTask" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn
      fab
      color="primary"
      :disable="!loaded"
      icon="add"
      title="Add new Task"
      @click="onAddnewTask"
    />
  </q-page-sticky>
</template>
