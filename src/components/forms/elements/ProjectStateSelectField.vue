<script lang="ts" setup>
import { ref } from "vue";
import { Validation } from "../../../types/forms/validation";
import { ProjectState } from "../../../types/project-types";

interface Props {
  validation: Validation;
  label: string;
  hint?: string;
  property: string;
  value: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "change", value: string): void }>();
const options = ref<string[]>(Object.values(ProjectState));

const internalValue = ref<string>(props.value);

function onChange(): void {
  emit("change", internalValue.value);
}
</script>

<template>
  <div :class="{ error: validation[property].$errors.length }">
    <q-select
      filled
      dark
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
