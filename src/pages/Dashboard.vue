<script lang="ts" setup>
import { useRouter } from "vue-router";
import TwoColumn from "../components/layout/TwoColumn.vue";
// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const router = useRouter();

async function onGeneratePdf() {
  const path = await ipcRenderer.invoke(
    "writeInvoiceDocument",
    "1ef9d03b-df04-6e80-b957-130a65ca821b"
  );
  console.log(path);
}
</script>

<template>
  <h1 class="text-h5">Welcome to your Dashboard</h1>

  <q-btn fab color="primary" @click="onGeneratePdf">Generate pdf</q-btn>

  <TwoColumn>
    <template v-slot:leftColumn>
      <q-card dark flat class="my-card">
        <q-card-section>
          <div class="text-h6 text-center">Manage your Invoices</div>
        </q-card-section>

        <q-card-section class="q-pt-none row justify-center items-center">
          <q-icon name="factory" size="xl" class="" />
        </q-card-section>

        <q-card-actions vertical>
          <q-btn
            color="primary"
            @click="() => router.push({ name: 'invoices' })"
            >Go to Invoices</q-btn
          >
        </q-card-actions>
      </q-card>
    </template>
    <template v-slot:rightColumn>
      <q-card dark flat class="my-card">
        <q-card-section>
          <div class="text-h6 text-center">Manage your Customers</div>
        </q-card-section>

        <q-card-section class="q-pt-none row justify-center items-center">
          <q-icon name="request_page" size="xl" class="" />
        </q-card-section>
        <q-card-actions vertical>
          <q-btn
            color="primary"
            @click="() => router.push({ name: 'customer' })"
            >Go to Customers</q-btn
          >
        </q-card-actions>
      </q-card>
    </template>
  </TwoColumn>
</template>
​
