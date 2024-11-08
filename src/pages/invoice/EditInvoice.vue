<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { Invoice } from "../../types/invoice-types";
import InvoiceDataForm from "../../components/forms/InvoiceDataForm.vue";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const router = useRouter();
const $q = useQuasar();
const invoice = ref<Invoice | null>(null);
const { id } = defineProps({ id: String });
const loaded = ref(false);

async function onSubmit(updatedInvoice: Invoice): Promise<void> {
  await ipcRenderer.invoke(
    "storeUpdate",
    "invoiceData",
    "invoiceData",
    id,
    JSON.parse(JSON.stringify(updatedInvoice))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your data has been updated successfully!",
  });
  await router.push({ name: "invoices" });
}

onMounted(async () => {
  const persistedInvocie = (await ipcRenderer.invoke(
    "storeGetSingle",
    "invoiceData",
    "invoiceData",
    id
  )) as Invoice;
  invoice.value = persistedInvocie;
  loaded.value = true;
});
</script>

<template>
  <h1 class="text-h5">Edit Invoice</h1>
  <div v-if="loaded">
    <InvoiceDataForm
      v-if="invoice"
      :form-data="invoice"
      v-on:submit="onSubmit"
    />
    <q-banner v-else inline-actions class="text-white bg-red">
      Invoice not found.
    </q-banner>
  </div>
  <div v-else>
    <q-skeleton type="rect" class="q-mb-md" />
    <q-skeleton type="rect" class="q-mb-md" />
    <q-skeleton type="rect" class="q-mb-md" />
    <q-skeleton type="rect" class="q-mb-md" />
  </div>
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
