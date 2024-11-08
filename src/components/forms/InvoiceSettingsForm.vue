<script lang="ts" setup>
import { useVuelidate } from "@vuelidate/core";
import { required, numeric } from "@vuelidate/validators";
import { InvoiceSettings } from "../../types/forms/invoice-settings-form-types";
import TextField from "./elements/TextField.vue";
import NumberField from "./elements/NumberField.vue";
import TextareaField from "./elements/TextareaField.vue";
import TwoColumn from "../layout/TwoColumn.vue";
import { useQuasar } from "quasar";
import { onMounted, ref } from "vue";

const props = defineProps<{
  formData: InvoiceSettings;
}>();
const emit = defineEmits<{
  (e: "submit", formData: InvoiceSettings): void;
}>();
const $q = useQuasar();
const rules = {
  defaultFont: { required },
  boldFont: { required },
  fontSize: { required, numeric },
  fontSizeSmall: { required, numeric },
  title: { required },
  introText: { required },
  paymentNote: { required },
  taxHint: { required },
  outroText: { required },
  signature: { required },
};
const v$ = useVuelidate(rules, props.formData);
const logo = ref<File | null>(null);

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
    message: "The submited date is not valid. Please check the form.",
  });
}

onMounted(async () => {
  if (props.formData.logo) {
    const fileName = props.formData.logo.split("/").pop();
    const response = await fetch(props.formData.logo);
    const blob = await response.blob();
    logo.value = new File([blob], fileName || "unknown");
  }
});
</script>

<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <TwoColumn>
      <template v-slot:leftColumn>
        <TextField
          label="Font*"
          hint="The default font of your invoice document."
          :validation="v$"
          property="defaultFont"
          :value="formData.defaultFont"
          @change="(value: string) => (formData.defaultFont = value)"
        />
      </template>
      <template v-slot:rightColumn>
        <TextField
          label="Bold font*"
          hint="The bold font of your invoice document."
          :validation="v$"
          property="boldFont"
          :value="formData.boldFont"
          @change="(value: string) => (formData.boldFont = value)"
        />
      </template>
    </TwoColumn>
    <TwoColumn>
      <template v-slot:leftColumn>
        <NumberField
          label="Font size*"
          hint="The default font size of your invoice document."
          :validation="v$"
          property="fontSize"
          :value="parseInt(formData.fontSize.toString())"
          @change="(value: number) => (formData.fontSize = value)"
        />
      </template>
      <template v-slot:rightColumn>
        <NumberField
          label="Small font size*"
          hint="The small font size of your invoice document."
          :validation="v$"
          property="fontSizeSmall"
          :value="parseInt(formData.fontSizeSmall.toString())"
          @change="(value: number) => (formData.fontSizeSmall = value)"
        />
      </template>
    </TwoColumn>

    <TextField
      label="Title*"
      hint="The title of your invoice document."
      :validation="v$"
      property="title"
      :value="formData.title"
      @change="(value: string) => (formData.title = value)"
    />
    <TextareaField
      label="Intro text*"
      hint="The intro text of your invoice document."
      :validation="v$"
      property="introText"
      :value="formData.introText"
      @change="(value: string) => (formData.introText = value)"
    />
    <TextareaField
      label="Payment note*"
      hint="The payment note of your invoice document."
      :validation="v$"
      property="paymentNote"
      :value="formData.paymentNote"
      @change="(value: string) => (formData.paymentNote = value)"
    />
    <TextareaField
      label="Tax hint*"
      hint="The tax hint of your invoice document."
      :validation="v$"
      property="taxHint"
      :value="formData.taxHint"
      @change="(value: string) => (formData.taxHint = value)"
    />
    <TextareaField
      label="Outro text*"
      hint="The outro text of your invoice document."
      :validation="v$"
      property="outroText"
      :value="formData.outroText"
      @change="(value: string) => (formData.outroText = value)"
    />
    <TextareaField
      label="Signature*"
      hint="The signature of your invoice document."
      :validation="v$"
      property="signature"
      :value="formData.signature"
      @change="(value: string) => (formData.signature = value)"
    />

    <q-file
      dark
      v-model="logo"
      label="Invoice logo"
      hint="Set the path of your logo file. This file wont be moved into the application."
      @update:modelValue="() => (formData.logo = logo?.path)"
    >
      <template v-slot:prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>

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
