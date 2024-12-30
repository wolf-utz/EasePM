<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import InvoiceListing from "../../components/listings/InvoiceListing.vue";
import InvoiceSettingsForm from "../../components/forms/InvoiceSettingsForm.vue";
import { InvoiceSettings } from "../../types/forms/invoice-settings-form-types";
import { useQuasar } from "quasar";
import { Invoice } from "../../types/invoice-types";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const $q = useQuasar();
const loaded = ref<boolean>(false);
const tab = ref<string>("invoices");
const invoices = ref<Invoice[]>([]);
const formData: InvoiceSettings = reactive<InvoiceSettings>({
  fontSize: 12,
  fontSizeSmall: 10,
  defaultFont: "Helvetica",
  boldFont: "Helvetica-Bold",
  title: "Invoice",
  introText:
    "Thank you for your order. I will charge you for the following service:",
  paymentNote: "Payable upon receipt of invoice.",
  taxHint: "According to §19 Abs. 1 UStG no sales tax will be charged.",
  outroText:
    "Thank you for your order and I look forward to working with you in the future.",
  signature: "Yours sincerely\n\nWolf-Peter Utz",
  logo: "/home/wolf/Desktop/logo-no-background.png",
});

async function loadInvoiceSettings() {
  Object.assign(
    formData,
    await ipcRenderer.invoke("storeGet", "invoiceData", "invoiceSettings")
  );
}
async function loadInvoices() {
  invoices.value =
    ((await ipcRenderer.invoke(
      "storeGet",
      "invoiceData",
      "invoiceData"
    )) as Invoice[]) || [];
}
async function onSubmitSettingsForm(invoiceSettings: InvoiceSettings) {
  await ipcRenderer.invoke(
    "storeSet",
    "invoiceData",
    "invoiceSettings",
    JSON.parse(JSON.stringify(invoiceSettings))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your data has been saved successfully!",
  });
}

async function onRefreshListing() {
  await loadInvoices();
}
onMounted(async () => {
  await loadInvoiceSettings();
  await loadInvoices();
  loaded.value = true;
});
</script>

<template>
  <h1 class="text-h5">Your invoices</h1>
  <q-card class="bg-dark">
    <q-tabs
      v-model="tab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="invoices" label="Invoices" />
      <q-tab name="settings" label="settings" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated class="bg-dark">
      <q-tab-panel name="invoices">
        <div class="text-h6">Invoices</div>
        <InvoiceListing
          :invoices="invoices"
          v-on:refresh-listing="onRefreshListing"
        />
      </q-tab-panel>

      <q-tab-panel name="settings">
        <div class="text-h6">Settings</div>
        <InvoiceSettingsForm
          v-if="loaded"
          :form-data="formData"
          v-on:submit="onSubmitSettingsForm"
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>
