<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Validation } from "../../../types/forms/validation";
import { Project } from "../../../types/project-types";
defineExpose({ refreshOptions });

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
interface Props {
  validation: Validation;
  label: string;
  hint?: string;
  property: string;
  value: string;
  customerId: string | null;
}

interface Option {
  label: string;
  value: string;
}
const props = defineProps<Props>();
const loaded = ref<boolean>(false);
const emit = defineEmits<{ (e: "change", value: string): void }>();
const options = ref<Option[]>([]);
const internalValue = ref<string>(props.value);

watch(
  () => props.customerId,
  async (newCustomerId) => {
    if (newCustomerId !== undefined) {
      internalValue.value = ""; // Reset selected project
      await refreshOptions(); // Refresh project list
    }
  }
);

function onChange(): void {
  emit("change", internalValue.value);
}

async function refreshOptions() {
  loaded.value = false;
  options.value = [];
  const persistedCustomers = (await ipcRenderer.invoke(
    "storeGet",
    "projectData",
    "projectData"
  )) as Project[];

  persistedCustomers.forEach((project) => {
    if (props.customerId && project._customerId !== props.customerId) {
      return;
    }

    options.value.push({
      value: project._id,
      label: project.title,
    });
  });
  loaded.value = true;
}

onMounted(refreshOptions);
</script>

<template>
  <div
    :class="{
      error: validation[property].$invalid && validation[property].$dirty,
    }"
  >
    <q-select
      :loading="!loaded"
      filled
      dark
      :error="validation[property].$invalid && validation[property].$dirty"
      v-model="internalValue"
      :label="label"
      :hint="hint"
      :options="options"
      emit-value
      map-options
      @keyup="onChange"
      @blur="onChange"
      @change="onChange"
    >
      <template v-slot:error>
        <div
          class="input-errors"
          v-for="error of validation[property].$errors"
          :key="error.$uid"
        >
          <div class="error-msg text-negative">{{ error.$message }}</div>
        </div>
      </template>
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey"> No results </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
