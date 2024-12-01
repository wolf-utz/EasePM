<script lang="ts" setup>
import { useRouter } from "vue-router";
import ThreeColumn from "../components/layout/ThreeColumn.vue";

const router = useRouter();
</script>

<template>
  <h1 class="text-h5">Welcome to your Dashboard</h1>
  <ThreeColumn>
    <template v-slot:leftColumn>
      <q-card dark flat class="my-card">
        <q-card-section>
          <div class="text-h6 text-center">Manage Invoices</div>
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
    <template v-slot:middleColumn>
      <q-card dark flat class="my-card">
        <q-card-section>
          <div class="text-h6 text-center">Manage Projects</div>
        </q-card-section>

        <q-card-section class="q-pt-none row justify-center items-center">
          <q-icon name="lightbulb" size="xl" class="" />
        </q-card-section>
        <q-card-actions vertical>
          <q-btn
            color="primary"
            @click="() => router.push({ name: 'projects' })"
            >Go to Projects</q-btn
          >
        </q-card-actions>
      </q-card>
    </template>
    <template v-slot:rightColumn>
      <q-card dark flat class="my-card">
        <q-card-section>
          <div class="text-h6 text-center">Manage Customers</div>
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
  </ThreeColumn>
</template>
​
