<script lang="ts" setup>
import { ref, watch } from "vue";
import { Validation } from "../../../types/forms/validation";

interface Props {
  validation: Validation;
  label: string;
  hint?: string;
  property: string;
  value: number; // value in cents
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "change", value: number): void }>();

const internalValue = ref<string>((props.value / 100).toFixed(2));

function onChange(): void {
  const integerValue = Math.round(parseFloat(internalValue.value) * 100);
  emit("change", integerValue);
}

// Watcher to enforce two decimal places
watch(internalValue, (newValue) => {
  const regex = /^\d+(\.\d{0,2})?$/;
  if (!regex.test(newValue)) {
    internalValue.value = parseFloat(newValue).toFixed(2);
  }
});
</script>

<template>
  <div :class="{ error: validation[property].$errors.length }">
    <q-input
      filled
      v-model="internalValue"
      :label="label"
      :hint="hint"
      lazy-rules
      dark
      :disable="disabled"
      type="text"
      :error="validation[property].$invalid && validation[property].$dirty"
      @keyup="onChange"
      @blur="onChange"
      @change="onChange"
    >
      <template v-slot:prepend> € </template>
      <template v-slot:error>
        <div
          class="input-errors"
          v-for="error of validation[property].$errors"
          :key="error.$uid"
        >
          <div class="error-msg text-negative">{{ error.$message }}</div>
        </div>
      </template>
    </q-input>
  </div>
</template>
