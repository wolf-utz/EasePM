<script lang="ts" setup>
import { ref } from "vue";
import { Invoice } from "../../types/invoice-types";
import { formatCurrency } from "../../util/format-currency";
import { convertUnixToGermanDate } from "../../util/timestamp";
import PDFViewer from "../PDFViewer.vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { saveAs } from "file-saver";
import { base64ToBlob } from "../../util/base64-to-blob";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
interface Props {
  invoices: Invoice[];
}
defineProps<Props>();
const emit = defineEmits<{
  (e: "refreshListing"): void;
}>();

const router = useRouter();
const $q = useQuasar();
const columns: Array<{
  name: string;
  label: string;
  field: string | ((row: any) => any);
  required?: boolean;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sort?: (a: any, b: any, rowA: any, rowB: any) => number;
  headerClasses?: string;
}> = [
  {
    name: "actions",
    label: "Actions",
    align: "center",
    field: "actions",
    sortable: false,
  },
  {
    name: "invoiceNumber",
    required: true,
    label: "Invoice number",
    align: "left",
    field: "invoiceNumber",
    sortable: true,
  },
  {
    name: "draft",
    required: true,
    label: "Is a draft",
    align: "left",
    field: "draft",
    sortable: true,
  },
  {
    name: "billed",
    required: true,
    label: "Is billed",
    align: "left",
    field: "billed",
    sortable: true,
  },
  {
    name: "invoiceDate",
    required: true,
    label: "Invoice Date",
    align: "left",
    field: "invoiceDate",
    sortable: true,
  },
  {
    name: "total",
    required: true,
    label: "Invoice total",
    align: "left",
    field: "total",
    sortable: true,
  },
];
const viewPdf = ref<boolean>(false);
const pdfBase64 = ref<string>("");
const openRemoveDialog = ref<boolean>(false);
const invoiceToRemove = ref<Invoice | null>(null);

async function onNew(): Promise<void> {
  await router.push({ name: "invoices/new" });
}
async function onEdit({ _id }: Invoice): Promise<void> {
  await router.push({
    name: "invoices/edit",
    params: { id: _id },
  });
}
function onOpenRemoveDialog(invoice: Invoice): void {
  invoiceToRemove.value = invoice;
  openRemoveDialog.value = true;
}
async function onRemoveInvoice(): Promise<void> {
  if (!invoiceToRemove) {
    return;
  }
  await ipcRenderer.invoke(
    "storeRemoveSingle",
    "invoiceData",
    "invoiceData",
    invoiceToRemove.value?._id
  );
  emit("refreshListing");
  invoiceToRemove.value = null;

  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "The data has been removed successfully!",
  });
}

async function onView(invoice: Invoice): Promise<void> {
  let base64String: string | null = await ipcRenderer.invoke(
    "fileManagerGetInvoice",
    invoice.invoiceNumber + ".pdf",
    invoice.draft
  );

  if (null === base64String) {
    await ipcRenderer.invoke("writeInvoiceDocument", invoice._id);
    base64String = await ipcRenderer.invoke(
      "fileManagerGetInvoice",
      invoice.invoiceNumber + ".pdf",
      invoice.draft
    );
    if (null === base64String) {
      console.error("could not find pdf for invoice");
      return;
    }
  }
  pdfBase64.value = base64String;
  viewPdf.value = true;
}

async function onMarkAsBilled(invoice: Invoice): Promise<void> {
  const updatedInvoice: Invoice = JSON.parse(JSON.stringify(invoice));
  updatedInvoice.billed = true;
  await ipcRenderer.invoke(
    "storeUpdate",
    "invoiceData",
    "invoiceData",
    updatedInvoice._id,
    updatedInvoice
  );
  emit("refreshListing");
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your invoice has been marked as billed successfully!",
  });
}
async function onPublish(invoice: Invoice): Promise<void> {
  const updatedInvoice: Invoice = JSON.parse(JSON.stringify(invoice));
  updatedInvoice.draft = false;
  await ipcRenderer.invoke(
    "storeUpdate",
    "invoiceData",
    "invoiceData",
    updatedInvoice._id,
    updatedInvoice
  );
  emit("refreshListing");
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your invoice has been published successfully!",
  });
}

async function onDownload(invoice: Invoice): Promise<void> {
  const pdfBase64 = await ipcRenderer.invoke(
    "fileManagerGetInvoice",
    `${invoice.invoiceNumber}.pdf`
  );
  saveAs(base64ToBlob(pdfBase64), `${invoice.invoiceNumber}.pdf`);
}
</script>

<template>
  <q-table
    dark
    flat
    bordered
    :loading="!invoices"
    :rows="invoices"
    :columns="columns"
    row-key="customerNumber"
  >
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm q-mb-sm"
          :disable="!props.row.draft"
          title="Edit invoce"
          @click="onEdit(props.row)"
        >
          <q-icon size="xs" color="grey" name="edit" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm q-mb-sm"
          :disable="!props.row.draft"
          title="Delete invoice"
          @click="onOpenRemoveDialog(props.row)"
        >
          <q-icon size="xs" color="grey" name="delete" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm q-mb-sm"
          title="View invoice"
          @click="onView(props.row)"
        >
          <q-icon size="xs" color="grey" name="visibility" />
        </q-btn>
        <br />
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm"
          :disable="props.row.draft"
          title="Download invoice"
          @click="onDownload(props.row)"
        >
          <q-icon size="xs" color="grey" name="download" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm"
          :disable="props.row.draft || props.row.billed"
          title="Mark invoice as billed"
          @click="onMarkAsBilled(props.row)"
        >
          <q-icon size="xs" color="grey" name="paid" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          color="dark"
          class="q-mr-sm"
          :disable="!props.row.draft"
          title="Publish invoice"
          @click="onPublish(props.row)"
        >
          <q-icon size="xs" color="grey" name="publish" />
        </q-btn>
      </q-td>
    </template>

    <template v-slot:body-cell-invoiceDate="props">
      <q-td :props="props">
        {{ convertUnixToGermanDate(props.row.invoiceDate) }}
      </q-td>
    </template>

    <template v-slot:body-cell-draft="props">
      <q-td :props="props">
        <q-icon
          v-if="props.row.draft"
          size="xs"
          color="grey"
          name="check_circle"
        />
        <q-icon v-else size="xs" color="grey" name="cancel" />
      </q-td>
    </template>

    <template v-slot:body-cell-billed="props">
      <q-td :props="props">
        <q-icon
          v-if="props.row.billed"
          size="xs"
          color="positive"
          name="check_circle"
        />
        <q-icon v-else size="xs" color="negative" name="cancel" />
      </q-td>
    </template>

    <template v-slot:body-cell-total="props">
      <q-td :props="props">
        {{ formatCurrency(props.row.total) }}
      </q-td>
    </template>
  </q-table>

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn
      fab
      color="primary"
      icon="add"
      title="Add new Invoice"
      @click="onNew()"
    />
  </q-page-sticky>

  <q-dialog v-model="viewPdf">
    <q-card class="bg-dark">
      <q-card-section>
        <div class="text-h6">Invoice</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <PDFViewer :pdfBase64="pdfBase64" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="openRemoveDialog" persistent>
    <q-card class="bg-dark">
      <q-card-section class="row items-center">
        <q-avatar icon="delete" color="negative" text-color="white" />
        <span class="q-pt-none q-ml-sm">
          Do you really want to remove the invoice?
        </span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn
          flat
          label="Remove invoice"
          color="negative"
          v-close-popup
          @click="onRemoveInvoice()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
