<script lang="ts" setup>
import AppCustomerForm from "../../components/forms/CustomerForm.vue";
import { Customer } from "../../types/forms/customer-types";
import { v6 as uuidv6, v6 } from "uuid";
import generateCustomer from "../../util/customer-number-generator";
import { useQuasar } from "quasar";
// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const $q = useQuasar();
const newCustomer: Customer = {
  _id: "",
  customerNumber: "",
  company: "",
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  city: "",
  zip: "",
  country: "",
};
function onSubmit(newCustomer: Customer) {
  newCustomer._id = uuidv6();
  newCustomer.customerNumber = generateCustomer(newCustomer);

  ipcRenderer.invoke(
    "storeAdd",
    "customerData",
    "customerData",
    JSON.parse(JSON.stringify(newCustomer))
  );
  $q.notify({
    progress: true,
    type: "positive",
    timeout: 1500,
    position: "top",
    message: "Your data has been saved successfully!",
  });
}
</script>

<template>
  <h1 class="text-h5">Create a new customer</h1>
  <AppCustomerForm v-on:submit="onSubmit" :formData="newCustomer" />
</template>
