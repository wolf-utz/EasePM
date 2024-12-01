<script lang="ts" setup>
import { ref } from "vue";
import {
  convertUnixTimestampToTimeInput,
  convertTimeInputToUnixTimestamp,
} from "../../../util/time-string-to-unix";

interface Props {
  label: string;
  hint?: string;
  property: string;
  value: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: "change", value: number): void }>();

const internalValue = ref<string>(convertUnixTimestampToTimeInput(props.value));

function onChange(): void {
  try {
    const trackedTimeAsTimeStamp = convertTimeInputToUnixTimestamp(
      internalValue.value
    );
    emit("change", trackedTimeAsTimeStamp);
  } catch (_) {
    // Ignore failed conversions.
  }
}

const isValidTimeString = (value: string) => {
  const regex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;
  return regex.test(value);
};
</script>

<template>
  <q-input
    filled
    v-model="internalValue"
    :label="label"
    hint="Format: 1w 1d 1h 1m"
    lazy-rules
    dark
    @keyup="onChange"
    @blur="onChange"
    @change="onChange"
    :rules="[
      (val) => !!val || 'Value required.',
      (val) =>
        isValidTimeString(val) ||
        'Invalid time format. Allowed format: 1w 1d 1h 1m',
    ]"
  />
</template>
