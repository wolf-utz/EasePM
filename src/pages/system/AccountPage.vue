<script lang="ts" setup>
import { reactive, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import AppPersonalFormData from "../../components/forms/PersonalDataForm.vue";
import { PersonalFormData } from "../../types/forms/personal-data-form-types";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;

const loaded = ref(false);
const $q = useQuasar();
const personalData = reactive<PersonalFormData>({
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  zip: "",
  country: "",
  email: "",
  banking: {
    iban: "",
    bic: "",
    bank: "",
  },
  taxId: "",
  taxNumber: "",
} as PersonalFormData);

async function loadPersonalData() {
  Object.assign(
    personalData,
    await ipcRenderer.invoke("storeGet", "personalData", "personalData")
  );
  loaded.value = true;
}

function onSubmit(personalData: PersonalFormData) {
  ipcRenderer.invoke(
    "storeSet",
    "personalData",
    "personalData",
    JSON.parse(JSON.stringify(personalData))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your data has been saved successfully!",
  });
}

onMounted(() => loadPersonalData());
</script>

<template>
  <AppPersonalFormData
    v-if="loaded"
    v-on:submit="onSubmit"
    :form-data="personalData"
  />
</template>
