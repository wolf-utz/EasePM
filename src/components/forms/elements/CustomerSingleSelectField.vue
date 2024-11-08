<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { Validation } from "../../../types/forms/validation";
import { Customer } from "../../../types/forms/customer-types";
// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
interface Props {
  validation: Validation;
  label: string;
  hint?: string;
  property: string;
  value: string;
}

interface CustomerOption {
  label: string;
  value: string;
}
const props = defineProps<Props>();
const loaded = ref<boolean>(false);
const emit = defineEmits<{ (e: "change", value: string): void }>();
const options = ref<CustomerOption[]>([]);

const internalValue = ref<string>(props.value);

function onChange(): void {
  emit("change", internalValue.value);
}

onMounted(async () => {
  const persistedCustomers = (await ipcRenderer.invoke(
    "storeGet",
    "customerData",
    "customerData"
  )) as Customer[];

  persistedCustomers.forEach((customer) => {
    options.value.push({
      value: customer._id,
      label: customer.firstName + " " + customer.lastName,
    });
  });
  loaded.value = true;
});
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
