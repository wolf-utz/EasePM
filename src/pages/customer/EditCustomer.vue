<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { Customer } from "../../types/forms/customer-types";
import AppCustomerForm from "../../components/forms/CustomerForm.vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const router = useRouter();
const $q = useQuasar();
const customer = ref<Customer | null>(null);
const { id } = defineProps({ id: String });
const loaded = ref(false);

function onSubmit(updatedCustomer: Customer) {
  ipcRenderer.invoke(
    "storeUpdate",
    "customerData",
    "customerData",
    id,
    JSON.parse(JSON.stringify(updatedCustomer))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your data has been updated successfully!",
  });
}

onMounted(async () => {
  const persistedCustomer = (await ipcRenderer.invoke(
    "storeGetSingle",
    "customerData",
    "customerData",
    id
  )) as Customer;
  customer.value = persistedCustomer;
  loaded.value = true;
});
</script>

<template>
  <h1 class="text-h5">Edit Customer</h1>
  <div v-if="loaded">
    <AppCustomerForm
      v-if="customer"
      :form-data="customer"
      v-on:submit="onSubmit"
    />
    <q-banner v-else inline-actions class="text-white bg-red">
      Customer not found.
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
      @click="() => router.push({ name: 'customer' })"
    />
  </q-page-sticky>
</template>
