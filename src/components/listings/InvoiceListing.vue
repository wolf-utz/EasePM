<script lang="ts" setup>
import { Invoice } from "../../types/invoice-types";
import { formatCurrency } from "../../util/format-currency";
import { convertUnixToGermanDate } from "../../util/timestamp";
interface Props {
  invoices: Invoice[];
}

const props = defineProps<Props>();
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
function onNew(): void {}
function onEdit(id: string): void {}
function onDelete(id: string): void {}
function onView(id: string): void {}
function onDownload(id: string): void {}
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
          class="q-mr-sm"
          :disable="!props.row.draft"
          title="Edit invoce"
          @click="onEdit(props.row._id)"
        >
          <q-icon size="xs" color="primary" name="edit" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          class="q-mr-sm"
          :disable="!props.row.draft"
          title="Delete invoice"
          @click="onDelete(props.row._id)"
        >
          <q-icon size="xs" color="negative" name="delete" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          class="q-mr-sm"
          :disable="!props.row.draft"
          title="View invoice"
          @click="onView(props.row._id)"
        >
          <q-icon size="xs" color="grey" name="visibility" />
        </q-btn>
        <q-btn
          fab
          dense
          round
          class="q-mr-sm"
          :disable="props.row.draft"
          title="Download invoice"
          @click="onDownload(props.row._id)"
        >
          <q-icon size="xs" color="grey" name="download" />
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
</template>
