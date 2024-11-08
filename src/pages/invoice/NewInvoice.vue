<script lang="ts" setup>
import InvoiceDataForm from "../../components/forms/InvoiceDataForm.vue";
import moment from "moment";
import { Invoice } from "../../types/invoice-types";
import { useQuasar } from "quasar";
import { v6 } from "uuid";
import { useRouter } from "vue-router";
import generateInvoiceNumber from "../../util/invoice-number-generator";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const $q = useQuasar();
const router = useRouter();
const formData: Invoice = {
  _id: "",
  _customerId: "",
  total: 0,
  invoiceNumber: "DRAFT",
  invoiceDate: moment.utc().unix(),
  deliveryDate: moment.utc().unix(),
  draft: true,
  canceled: false,
  billed: false,
  lineItems: [],
};

async function onSubmit(invoice: Invoice): Promise<void> {
  invoice._id = v6();
  invoice.invoiceNumber = await generateInvoiceNumber(invoice);
  await ipcRenderer.invoke(
    "storeAdd",
    "invoiceData",
    "invoiceData",
    JSON.parse(JSON.stringify(invoice))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "The draft of the invoice has been created successfully.",
  });
  await router.push({ name: "invoices" });
}
</script>

<template>
  <h1 class="text-h5">New invoice</h1>

  <InvoiceDataForm :form-data="formData" v-on:submit="onSubmit" />
  <q-page-sticky position="top-right" :offset="[18, 18]">
    <q-btn
      fab
      icon="arrow_back"
      color="dark"
      title="Back to listing"
      @click="() => router.push({ name: 'invoices' })"
    />
  </q-page-sticky>
</template>
