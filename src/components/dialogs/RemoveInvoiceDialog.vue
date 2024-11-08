<script lang="ts" setup>
import { useQuasar } from "quasar";
import { Invoice } from "../../types/invoice-types";
import { useRouter } from "vue-router";
import { ref } from "vue";

interface Props {
  invoice: Invoice;
  toggle: boolean;
}
const props = defineProps<Props>();

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const $q = useQuasar();
const router = useRouter();
const confirm = ref<boolean>(props.toggle);
async function onRemove() {
  await ipcRenderer.invoke(
    "storeRemoveSingle",
    "invoiceData",
    "invoiceData",
    props.invoice._id
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "The data has been removed successfully!",
  });
  await router.push({ name: "invoices" });
}
</script>

<template>
  <q-dialog v-model="confirm" persistent>
    <q-card class="bg-dark">
      <q-card-section class="row items-center">
        <q-avatar icon="delete" color="negative" text-color="white" />
        <span class="q-pt-none q-ml-sm">
          Do you really want to remove the invoice
          <b>{{ invoice.invoiceNumber }}</b>
        </span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn
          flat
          label="Remove invoice"
          color="negative"
          v-close-popup
          @click="onRemove"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
