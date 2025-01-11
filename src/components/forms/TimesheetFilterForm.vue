<script lang="ts" setup>
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { useQuasar } from "quasar";
import { TimesheetFilter } from "../../types/forms/timesheet-filter-types";
import DateField from "./elements/DateField.vue";
import {
  dateStringToUnixTimestamp,
  unixTimestampToDateString,
} from "../../util/timestamp";
import ProjectSingleSelectField from "./elements/ProjectSingleSelectField.vue";
import CustomerSingleSelectField from "./elements/CustomerSingleSelectField.vue";

const props = defineProps<{
  formData: TimesheetFilter;
}>();
const emit = defineEmits<{
  (e: "submit", formData: TimesheetFilter): void;
}>();

const formData = reactive<TimesheetFilter>(props.formData);
const $q = useQuasar();
const rules = {
  startDate: { required },
  endDate: { required },
  _customerId: { required },
  _projectId: {},
};
const v$ = useVuelidate(rules, formData);

function onSubmit(): void {
  v$.value.$touch();
  if (!v$.value.$invalid) {
    emit("submit", JSON.parse(JSON.stringify(props.formData)));
    return;
  }

  $q.notify({
    progress: true,
    type: "negative",
    timeout: 1500,
    position: "top",
    message: "The submited data is not valid. Please check the form.",
  });
}
</script>

<template>
  <q-form
    @submit="onSubmit"
    class="time-sheet-filter row q-col-gutter-md items-center"
  >
    <div class="col col-sm-6 col-md-2">
      <DateField
        :validation="v$"
        label="Start date"
        hint="Start date of the report."
        property="startDate"
        :value="unixTimestampToDateString(formData.startDate, 'YYYY/MM/DD')"
        @change="(value: string) => formData.startDate = dateStringToUnixTimestamp(value, 'YYYY/MM/DD')"
      />
    </div>
    <div class="col col-sm-6 col-md-2">
      <DateField
        :validation="v$"
        label="End date"
        hint="End date of the report."
        property="endDate"
        :value="unixTimestampToDateString(formData.endDate, 'YYYY/MM/DD')"
        @change="(value: string) => formData.endDate = dateStringToUnixTimestamp(value, 'YYYY/MM/DD')"
      />
    </div>
    <div class="col col-sm-6 col-md-3">
      <CustomerSingleSelectField
        :validation="v$"
        label="Customer"
        hint="Select customer"
        property="_customerId"
        :value="formData._customerId"
        @change="
          (value) => {
            formData._customerId = value;
            formData._projectId = '';
          }
        "
      />
    </div>
    <div class="col col-sm-6 col-md-4">
      <ProjectSingleSelectField
        :validation="v$"
        label="Project"
        hint="Select project (Optional)"
        property="_projectId"
        :value="formData._projectId"
        @change="(value) => (formData._projectId = value)"
        :customerId="formData._customerId"
      />
    </div>
    <div class="col col-sm-6 col-md-1">
      <q-btn icon="save" type="submit" color="primary" title="Apply filter" />
    </div>
  </q-form>
</template>
