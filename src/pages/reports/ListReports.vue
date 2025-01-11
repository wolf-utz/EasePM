<script lang="ts" setup>
import { useRouter } from "vue-router";
import TwoColumn from "../../components/layout/TwoColumn.vue";

const router = useRouter();
</script>

<template>
  <h1 class="text-h5">Your Reports</h1>
  <TwoColumn>
    <template v-slot:leftColumn>
      <q-card dark flat class="my-card">
        <q-card-section>
          <div class="text-h6 text-center">Time sheet Report</div>
        </q-card-section>

        <q-card-section class="q-pt-none row justify-center items-center">
          <q-icon name="summarize" size="xl" class="" />
        </q-card-section>

        <q-card-actions vertical>
          <q-btn
            color="primary"
            @click="() => router.push({ name: 'reports/time-sheet' })"
            >Go to Time sheet</q-btn
          >
        </q-card-actions>
      </q-card>
    </template>
    <template v-slot="rightColumn"> </template>
  </TwoColumn>
</template>
