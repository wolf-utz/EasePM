<script lang="ts" setup>
import { ref } from "vue";
import { Validation } from "../../../types/forms/validation";

interface Props {
  validation: Validation;
  label: string;
  hint?: string;
  property: string;
  value: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "change", value: boolean): void }>();

const internalValue = ref<boolean>(props.value);

function onChange(): void {
  emit("change", !internalValue.value);
}
</script>

<template>
  <q-checkbox
    filled
    v-model="internalValue"
    :label="label"
    :hint="hint"
    lazy-rules
    dark
    @keyup="onChange"
    @blur="onChange"
    @change="onChange"
  >
  </q-checkbox>
</template>
