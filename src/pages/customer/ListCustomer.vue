<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Customer } from "../../types/forms/customer-types";
import { useQuasar } from "quasar";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const router = useRouter();
const $q = useQuasar();
const loaded = ref<boolean>(false);
const customers = ref<Customer[]>([]);
const customerToRemove = ref<Customer | null>(null);
const confirm = ref(<boolean>false);
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
    name: "customerNumber",
    required: true,
    label: "Customer number",
    align: "left",
    field: "customerNumber",
    sortable: false,
  },
  {
    name: "name",
    required: true,
    label: "Name",
    align: "left",
    field: "name",
    sortable: true,
  },
  {
    name: "firstName",
    required: true,
    label: "First name",
    align: "left",
    field: "firstName",
    sortable: true,
  },
  {
    name: "lastName",
    required: true,
    label: "First name",
    align: "left",
    field: "lastName",
    sortable: true,
  },
  {
    name: "city",
    required: true,
    label: "City",
    align: "left",
    field: "city",
    sortable: true,
  },
  {
    name: "zip",
    required: true,
    label: "ZIP",
    align: "left",
    field: "zip",
    sortable: true,
  },
  {
    name: "actions",
    label: "Actions",
    align: "center",
    field: "actions",
    sortable: false,
  },
];

async function onAddnewCustomer() {
  await router.push({ name: "customer/new" });
}

function onEditCustomer(customer: Customer) {
  router.push({
    name: "customer/edit",
    params: { id: customer._id },
  });
}
function openRemoveCustomerConfirmDialoge(customer: Customer) {
  customerToRemove.value = customer;
  confirm.value = true;
}
async function onRemoveCustomer() {
  if (!customerToRemove) {
    return;
  }
  console.log("remove", customerToRemove.value);

  ipcRenderer.invoke(
    "storeRemoveSingle",
    "customerData",
    "customerData",
    customerToRemove.value?._id
  );
  customerToRemove.value = null;

  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "The data has been removed successfully!",
  });

  const persistedCustomers = (await ipcRenderer.invoke(
    "storeGet",
    "customerData",
    "customerData"
  )) as Customer[];
  customers.value = persistedCustomers;
}

onMounted(async () => {
  const persistedCustomers = (await ipcRenderer.invoke(
    "storeGet",
    "customerData",
    "customerData"
  )) as Customer[];
  customers.value = persistedCustomers;
  loaded.value = true;
});
</script>

<template>
  <h1 class="text-h5">Your Customers</h1>
  <q-table
    dark
    flat
    bordered
    :loading="!loaded"
    :rows="customers"
    :columns="columns"
    row-key="customerNumber"
  >
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn
          fab
          dense
          round
          color="accent"
          icon="edit"
          title="Edit Customer"
          @click="onEditCustomer(props.row)"
        />
        <q-btn
          fab
          dense
          round
          color="negative"
          icon="delete_forever"
          title="Remove Customer"
          class="q-ml-sm"
          @click="openRemoveCustomerConfirmDialoge(props.row)"
        />
      </q-td>
    </template>
  </q-table>

  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn
      fab
      color="primary"
      :disable="!loaded"
      icon="add"
      title="Add new Customer"
      @click="onAddnewCustomer"
    />
  </q-page-sticky>

  <q-dialog v-model="confirm" persistent>
    <q-card class="bg-dark">
      <q-card-section class="row items-center">
        <q-avatar icon="delete" color="negative" text-color="white" />
        <span class="q-pt-none q-ml-sm">
          Do you really want to remove the customer
          <b>{{ customerToRemove?.customerNumber }}</b>
        </span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn
          flat
          label="Remove customer"
          color="negative"
          v-close-popup
          @click="onRemoveCustomer"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
