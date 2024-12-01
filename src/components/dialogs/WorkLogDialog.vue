<script lang="ts" setup>
import { useQuasar } from "quasar";
import { Invoice } from "../../types/invoice-types";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { WorkLog } from "../../types/project-types";
import WorkLogForm from "../forms/WorkLogForm.vue";

interface Props {
  title: string;
  workLog: WorkLog;
  confirm: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "submit", workLog: WorkLog): void;
}>();

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const $q = useQuasar();
const confirm = ref<boolean>(props.confirm);
async function onSubmit(workLog: WorkLog): Promise<void> {
  emit("submit", JSON.parse(JSON.stringify(workLog)));
}
</script>

<template>
  <q-dialog
    v-model="confirm"
    persistent
    transition-show="scale"
    transition-hide="scale"
    backdrop-filter="blur(4px)"
  >
    <q-card flat dark style="width: 100%; max-width: 600px">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section>
        <WorkLogForm :form-data="workLog" v-on:submit="onSubmit" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
