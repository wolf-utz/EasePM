<script lang="ts" setup>
import { computed, onMounted, watch } from "vue";
import { TimesheetFilter } from "../types/forms/timesheet-filter-types";
import { Project, Task, WorkLog } from "../types/project-types";
import { ref } from "vue";
import { convertUnixTimestampToTimeInput } from "../util/time-string-to-unix";
import { saveAs } from "file-saver";
import { base64ToBlob } from "../util/base64-to-blob";

interface Props {
  filter: TimesheetFilter;
}
interface ReportDataRow {
  project: Project;
  task: Task;
  workLog: WorkLog;
}

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const props = defineProps<Props>();

const reportDataRows = ref<ReportDataRow[]>([]);

const formattedReportDataRows = computed(() =>
  reportDataRows.value.map((row) => ({
    project: row.project.projectNumber,
    task: row.task.title,
    message: row.workLog.message,
    trackedTime: convertUnixTimestampToTimeInput(row.workLog.trackedTime),
  }))
);

const total = computed(() =>
  reportDataRows.value.reduce((sum, row) => sum + row.workLog.trackedTime, 0)
);

const columns = [
  {
    name: "project",
    required: true,
    label: "Project Nr.",
    align: "left",
    field: "project",
    sortable: true,
  },
  {
    name: "task",
    align: "left",
    label: "Task",
    field: "task",
    sortable: true,
    style: "text-wrap: balance",
  },
  {
    name: "trackedTime",
    align: "left",
    label: "Tracked Time",
    field: "trackedTime",
    sortable: true,
  },
  {
    name: "message",
    align: "left",
    label: "Work Log",
    field: "message",
    sortable: false,
    style: "text-wrap: balance",
  },
];

async function refreshReportData(): Promise<void> {
  reportDataRows.value = await ipcRenderer.invoke(
    "createTimeSheetReportData",
    JSON.parse(JSON.stringify(props.filter))
  );
}

async function onDownload() {
  const reportFilePath = (await ipcRenderer.invoke(
    "createTimeSheetReportCsvString",
    JSON.parse(JSON.stringify(props.filter))
  )) as string;
  const pdfBase64 = await ipcRenderer.invoke(
    "fileManagerGetFileBase64",
    reportFilePath
  );
  saveAs(base64ToBlob(pdfBase64), "time-sheet.xlsx");
}

watch(() => props.filter, refreshReportData, { deep: true });
onMounted(refreshReportData);
</script>

<template>
  <q-banner
    v-if="formattedReportDataRows.length === 0"
    class="bg-orange text-white"
  >
    No data to export found
  </q-banner>

  <q-banner
    v-if="formattedReportDataRows.length > 0 && total"
    class="bg-orange text-white"
  >
    Total Tracked Time: {{ convertUnixTimestampToTimeInput(total) }}
  </q-banner>
  <q-table
    v-if="formattedReportDataRows.length > 0"
    dark
    flat
    bordered
    title="Time sheet Preview based on your filter"
    :rows="formattedReportDataRows"
    :columns="columns"
    :rows-per-page-options="[25, 50, 100]"
  >
    <template v-slot:top-right>
      <q-btn
        color="primary"
        icon-right="archive"
        label="Export"
        no-caps
        @click="onDownload"
      />
    </template>
  </q-table>
</template>
