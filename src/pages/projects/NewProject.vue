<script lang="ts" setup>
import AppProjectForm from "../../components/forms/ProjectForm.vue";
import { Project, ProjectState } from "../../types/project-types";
import { v6 as uuidv6, v6 } from "uuid";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import moment from "moment";
import generateProjectNumber from "../../util/project-number-generator";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const $q = useQuasar();
const router = useRouter();
const newProject: Project = {
  _id: "",
  _customerId: "",
  projectNumber: "",
  title: "",
  description: "",
  state: ProjectState.OPEN,
  creationDateTime: 0,
  tasks: [],
  taskAutoIncrement: 1,
};
async function onSubmit(newProject: Project) {
  newProject._id = uuidv6();
  newProject.projectNumber = await generateProjectNumber(newProject);
  newProject.creationDateTime = moment().unix();

  await ipcRenderer.invoke(
    "storeAdd",
    "projectData",
    "projectData",
    JSON.parse(JSON.stringify(newProject))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your data has been saved successfully!",
  });
  await router.push({ name: "projects" });
}
</script>

<template>
  <h1 class="text-h5">Create a new project</h1>
  <AppProjectForm v-on:submit="onSubmit" :formData="newProject" />
</template>
