<script lang="ts" setup>
import { reactive } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { Project, ProjectState } from "../../types/project-types";
import TextField from "./elements/TextField.vue";
import CustomerSingleSelectField from "./elements/CustomerSingleSelectField.vue";
import TextareaField from "./elements/TextareaField.vue";
import { useQuasar } from "quasar";
import ProjectStateSelectField from "./elements/ProjectStateSelectField.vue";

const props = defineProps<{
  formData: Project;
}>();
const emit = defineEmits<{
  (e: "submit", formData: Project): void;
}>();
const formData = reactive<Project>(props.formData);
const $q = useQuasar();
const rules = {
  _id: {},
  _customerId: {},
  title: { required },
  projectNumber: {},
  description: { required },
  state: { required },
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
  <q-form @submit="onSubmit" class="q-gutter-md">
    <CustomerSingleSelectField
      :validation="v$"
      label="Customer"
      hint="Select customer"
      property="_customerId"
      :value="formData._customerId"
      @change="(value: string) => (formData._customerId = value)"
    />

    <TextField
      label="Project title*"
      hint="Project title."
      :validation="v$"
      property="title"
      :value="formData.title"
      @change="(value: string) => (formData.title = value)"
    />

    <TextareaField
      label="Project description*"
      hint="Project description."
      :validation="v$"
      property="description"
      :value="formData.description"
      @change="(value: string) => (formData.description = value)"
    />

    <ProjectStateSelectField
      label="State*"
      hint="Project state."
      :validation="v$"
      property="state"
      :value="formData.state"
      @change="(value: string) => (formData.state = value)"
    />

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="save"
        type="submit"
        color="primary"
        title="Save record"
      />
    </q-page-sticky>
  </q-form>
</template>
