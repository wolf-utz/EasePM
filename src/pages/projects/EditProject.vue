<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { Project } from "../../types/project-types";
import ProjectForm from "../../components/forms/ProjectForm.vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const router = useRouter();
const $q = useQuasar();
const project = ref<Project | null>(null);
const { id } = defineProps({ id: String });
const loaded = ref(false);

async function onSubmit(updatedProject: Project): Promise<void> {
  await ipcRenderer.invoke(
    "storeUpdate",
    "projectData",
    "projectData",
    id,
    JSON.parse(JSON.stringify(updatedProject))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your data has been updated successfully!",
  });
  await router.push({ name: "projects" });
}

onMounted(async () => {
  project.value = (await ipcRenderer.invoke(
    "storeGetSingle",
    "projectData",
    "projectData",
    id
  )) as Project;
  loaded.value = true;
});
</script>

<template>
  <h1 class="text-h5">Edit Project</h1>
  <div v-if="loaded">
    <ProjectForm v-if="project" :form-data="project" v-on:submit="onSubmit" />
    <q-banner v-else inline-actions class="text-white bg-red">
      Project not found.
    </q-banner>
  </div>
  <div v-else>
    <q-skeleton type="rect" class="q-mb-md" />
    <q-skeleton type="rect" class="q-mb-md" />
    <q-skeleton type="rect" class="q-mb-md" />
    <q-skeleton type="rect" class="q-mb-md" />
  </div>
  <q-page-sticky position="top-right" :offset="[18, 18]">
    <q-btn
      fab
      icon="arrow_back"
      color="dark"
      title="Back to listing"
      @click="() => router.push({ name: 'projects' })"
    />
  </q-page-sticky>
</template>
