<script lang="ts" setup>
import { ref } from "vue";
import { Validation } from "../../../types/forms/validation";

interface Props {
  validation: Validation;
  label: string;
  hint?: string;
  property: string;
  value: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "change", value: string): void }>();

const internalValue = ref<string>(props.value);

function onChange(): void {
  emit("change", internalValue.value);
}
</script>

<template>
  <div :class="{ error: validation[property].$errors.length }">
    <p class="q-field__bottom q-dark">{{ label }}</p>
    <q-editor
      min-height="5rem"
      filled
      autogrow
      v-model="internalValue"
      lazy-rules
      dark
      :error="validation[property].$invalid && validation[property].$dirty"
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
    </q-editor>
  </div>
</template>
