<script lang="ts" setup>
import { useRouter } from "vue-router";
import TimesheetFilterForm from "../../components/forms/TimesheetFilterForm.vue";
import moment from "moment";
import { TimesheetFilter } from "../../types/forms/timesheet-filter-types";
import { reactive, ref } from "vue";
import { saveAs } from "file-saver";
import { base64ToBlob } from "../../util/base64-to-blob";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const router = useRouter();
const filter = reactive({
  startDate: moment().unix(),
  endDate: moment().unix(),
  _customerId: "",
  _projectId: "",
}) as TimesheetFilter;

async function onDownload() {
  const reportFilePath = (await ipcRenderer.invoke(
    "createTimeSheetReportCsvString",
    JSON.parse(JSON.stringify(filter))
  )) as string;
  const pdfBase64 = await ipcRenderer.invoke(
    "fileManagerGetFileBase64",
    reportFilePath
  );
  saveAs(base64ToBlob(pdfBase64), "time-sheet.xlsx");
}
function onApplyFilter() {}
</script>

<template>
  <h1 class="text-h5">Time Sheet</h1>

  <TimesheetFilterForm :form-data="filter" v-on:submit="onApplyFilter" />

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn
      fab
      icon="download"
      color="primary"
      title="Download time sheet"
      @click.prevent="onDownload"
    />
  </q-page-sticky>
</template>
