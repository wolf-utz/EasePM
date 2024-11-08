<script lang="ts" setup>
import { ref, watch } from "vue";
import { Validation } from "../../../types/forms/validation";
import moment from "moment";

interface Props {
  validation: Validation;
  label: string;
  hint?: string;
  property: string;
  value: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "change", value: string): void }>();
const date = ref(props.value);

watch(date, (newValue, _) => {
  if (moment(newValue, "YYYY/MM/DD", true).isValid()) {
    emit("change", newValue);
  }
});
</script>

<template>
  <div :class="{ error: validation[property].$errors.length }">
    <q-input
      filled
      dark
      v-model="date"
      :label="label"
      :hint="hint"
      lazy-rules
      mask="date"
      :rules="['date']"
      :error="validation[property].$invalid && validation[property].$dirty"
    >
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              dark
              v-model="date"
              square
              flat
              bordered
              :title="label"
              :subtitle="date"
            >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="Close" color="primary" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
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
