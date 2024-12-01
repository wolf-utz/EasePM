<script lang="ts" setup>
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import TimeTrackerField from "./elements/TimeTrackerField.vue";
import { useQuasar } from "quasar";
import { WorkLog } from "../../types/project-types";
import TextareaField from "./elements/TextareaField.vue";
import CheckboxField from "./elements/CheckboxField.vue";
import TwoColumn from "../layout/TwoColumn.vue";

const props = defineProps<{
  formData: WorkLog;
}>();
const emit = defineEmits<{
  (e: "submit", formData: WorkLog): void;
}>();

const formData = reactive<WorkLog>(props.formData);
const $q = useQuasar();
const rules = {
  message: { required },
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
  <q-form @submit="onSubmit" class="q-gutter-md q-mt-md">
    <TwoColumn>
      <template v-slot:leftColumn>
        <TimeTrackerField
          label="Tracked time*"
          property="trackedTime"
          :value="formData.trackedTime"
          @change="(value: number) => (formData.trackedTime = value)"
      /></template>
      <template v-slot:rightColumn>
        <CheckboxField
          label="Billable"
          hint="Is this tracked time billable?"
          :validation="v$"
          property="billable"
          :value="formData.billable"
          @change="(value: boolean) => (formData.billable = value)"
      /></template>
    </TwoColumn>

    <TextareaField
      label="Message*"
      hint="What did you do?"
      :validation="v$"
      property="message"
      :value="formData.message"
      @change="(value: string) => (formData.message = value)"
    />

    <q-btn dark flat type="submit" icon="add" label="Save" color="primary" />
  </q-form>
</template>
