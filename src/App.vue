<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Ref } from "vue";
import { useRoute } from "vue-router";

// @ts-ignore
const ipcRenderer: ElectronApi = window.ipcRenderer;
const leftDrawerOpen: Ref<boolean> = ref(false);
const route = useRoute();
const version = ref<string>("-");
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

onMounted(async () => {
  version.value = (await ipcRenderer.invoke("getAppVersion")) as string;
});
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>Ease PM | {{ route.meta.title }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      show-if-above
      v-model="leftDrawerOpen"
      side="left"
      :width="200"
      :breakpoint="700"
      elevated
      class="bg-dark text-white"
    >
      <q-scroll-area class="fit">
        <div class="q-pa-sm">
          <q-list style="min-width: 100px">
            <q-item-label header>Home</q-item-label>

            <q-item to="/" exact>
              <q-item-section avatar>
                <q-icon name="dashboard" />
              </q-item-section>
              <q-item-section> Dashboard </q-item-section>
            </q-item>

            <q-separator />

            <q-item-label header>Accounting</q-item-label>

            <q-item to="/invoices" exact>
              <q-item-section avatar>
                <q-icon name="request_page" />
              </q-item-section>
              <q-item-section> Invoice </q-item-section>
            </q-item>

            <q-item to="/offers" exact :disable="true">
              <q-item-section avatar>
                <q-icon name="note_add" />
              </q-item-section>
              <q-item-section> Offers </q-item-section>
            </q-item>

            <q-item to="/analytics" exact>
              <q-item-section avatar>
                <q-icon name="analytics" />
              </q-item-section>
              <q-item-section> Analytics </q-item-section>
            </q-item>

            <q-separator />
            <q-item-label header>Project Management</q-item-label>

            <q-item to="/projects" exact>
              <q-item-section avatar>
                <q-icon name="lightbulb" />
              </q-item-section>
              <q-item-section> Projects </q-item-section>
            </q-item>

            <q-item to="/customers" exact>
              <q-item-section avatar>
                <q-icon name="factory" />
              </q-item-section>
              <q-item-section> Customers </q-item-section>
            </q-item>

            <q-separator />
            <q-item-label header>Reports</q-item-label>

            <q-item to="/reports/time-sheet" exact>
              <q-item-section avatar>
                <q-icon name="summarize" />
              </q-item-section>
              <q-item-section> Time sheet </q-item-section>
            </q-item>

            <q-separator />
            <q-item-label header>System</q-item-label>

            <q-item to="/account" exact>
              <q-item-section avatar>
                <q-icon name="account_circle" />
              </q-item-section>
              <q-item-section> Account </q-item-section>
            </q-item>

            <q-item to="/settings" exact :disable="true">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section> Settings </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="text-white">
      <router-view v-slot="{ Component }">
        <Transition>
          <q-page padding>
            <component :is="Component" />
          </q-page>
        </Transition>
      </router-view>
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar class="justify-end">
        <p class="q-mb-none text-right">Alpha | Version {{ version }}</p>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>
