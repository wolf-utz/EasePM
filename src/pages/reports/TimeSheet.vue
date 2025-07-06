<script lang="ts" setup>
import TimesheetFilterForm from "../../components/forms/TimesheetFilterForm.vue";
import TimeSheetPreview from "../../components/TimeSheetPreview.vue";
import moment from "moment";
import { TimesheetFilter } from "../../types/forms/timesheet-filter-types";
import { computed, reactive } from "vue";

const filter = reactive({
  startDate: moment().startOf("month").add(1, "day").unix(),
  endDate: moment().endOf("month").unix(),
  _customerId: "",
  _projectId: "",
}) as TimesheetFilter;
const showPreview = computed(
  () => filter._customerId && filter.startDate && filter.endDate
);

function onApplyFilter() {}
</script>

<template>
  <h1 class="text-h5">Time Sheet</h1>
  <TimesheetFilterForm :form-data="filter" v-on:submit="onApplyFilter" />
  <TimeSheetPreview v-if="showPreview" :filter="filter" />
</template>
