<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Project } from "../../types/project-types";
import { useQuasar } from "quasar";
import { convertUnixToGermanDate } from "../../util/timestamp";
import { calculateBillableTime } from "../../util/project-util";
import { convertUnixTimestampToTimeInput } from "../../util/time-string-to-unix";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const router = useRouter();
const $q = useQuasar();
const loaded = ref<boolean>(false);
const projects = ref<Project[]>([]);
const projectToRemove = ref<Project | null>(null);
const confirm = ref(<boolean>false);
const columns: Array<{
  name: string;
  label: string;
  field: string | ((row: any) => any);
  required?: boolean;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sort?: (a: any, b: any, rowA: any, rowB: any) => number;
  headerClasses?: string;
}> = [
  {
    name: "actions",
    label: "Actions",
    align: "center",
    field: "actions",
    sortable: false,
  },
  {
    name: "projectNumber",
    required: true,
    label: "Project number",
    align: "left",
    field: "projectNumber",
    sortable: false,
  },
  {
    name: "billableTrackedWork",
    required: true,
    label: "Billable tracked work",
    align: "left",
    field: "billableTrackedWork",
    sortable: false,
  },
  {
    name: "title",
    required: true,
    label: "Title",
    align: "left",
    field: "title",
    sortable: true,
  },
  {
    name: "state",
    required: true,
    label: "State",
    align: "left",
    field: "state",
    sortable: true,
  },
  {
    name: "creationDateTime",
    required: true,
    label: "Created At",
    align: "left",
    field: "creationDateTime",
    sortable: true,
  },
];

async function onAddNewProject() {
  await router.push({ name: "projects/new" });
}

function onEditProject(project: Project) {
  router.push({
    name: "projects/edit",
    params: { id: project._id },
  });
}
function onOpenRemoveProjectConfirmDialoge(project: Project) {
  projectToRemove.value = project;
  confirm.value = true;
}
function onOpenKanban(project: Project) {
  router.push({
    name: "projects/kanban",
    params: { id: project._id },
  });
}
async function onRemoveProject() {
  if (!projectToRemove) {
    return;
  }

  await ipcRenderer.invoke(
    "storeRemoveSingle",
    "projectData",
    "projectData",
    projectToRemove.value?._id
  );
  projectToRemove.value = null;

  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "The data has been removed successfully!",
  });

  const persistedprojects = (await ipcRenderer.invoke(
    "storeGet",
    "projectData",
    "projectData"
  )) as Project[];
  projects.value = persistedprojects;
}

onMounted(async () => {
  projects.value =
    ((await ipcRenderer.invoke(
      "storeGet",
      "projectData",
      "projectData"
    )) as Project[]) || [];
  loaded.value = true;
});
</script>

<template>
  <h1 class="text-h5">Your Projects</h1>
  <q-table
    dark
    flat
    bordered
    :loading="!loaded"
    :rows="projects"
    :columns="columns"
    row-key="projectNumber"
  >
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm"
          title="Edit project"
          @click="onEditProject(props.row)"
        >
          <q-icon size="xs" color="grey" name="edit" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm"
          title="Remove project"
          @click="onOpenRemoveProjectConfirmDialoge(props.row)"
        >
          <q-icon size="xs" color="grey" name="delete_forever" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm"
          title="Open kanban board"
          @click="onOpenKanban(props.row)"
        >
          <q-icon size="xs" color="grey" name="view_kanban" />
        </q-btn>
      </q-td>
    </template>

    <template v-slot:body-cell-billableTrackedWork="props">
      <q-td :props="props">
        {{ convertUnixTimestampToTimeInput(calculateBillableTime(props.row)) }}
      </q-td>
    </template>

    <template v-slot:body-cell-creationDateTime="props">
      <q-td :props="props">
        {{ convertUnixToGermanDate(props.row.creationDateTime) }}
      </q-td>
    </template>
  </q-table>

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn
      fab
      color="primary"
      :disable="!loaded"
      icon="add"
      title="Add new Project"
      @click="onAddNewProject"
    />
  </q-page-sticky>

  <q-dialog v-model="confirm" persistent>
    <q-card class="bg-dark">
      <q-card-section class="row items-center">
        <q-avatar icon="delete" color="negative" text-color="white" />
        <span class="q-pt-none q-ml-sm">
          Do you really want to remove the project
          <b>{{ projectToRemove?.title }}</b>
        </span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn
          flat
          label="Remove project"
          color="negative"
          v-close-popup
          @click="onRemoveProject"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
