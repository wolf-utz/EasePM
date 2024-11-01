import type {} from "vue";
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import Dashboard from "./pages/Dashboard.vue";
import AccountPage from "./pages/system/AccountPage.vue";
import ListInvoice from "./pages/invoice/ListInvoice.vue";
import ListCustomer from "./pages/customer/ListCustomer.vue";
import NewCustomer from "./pages/customer/NewCustomer.vue";
import EditCustomer from "./pages/customer/EditCustomer.vue";
import NewInvoice from "./pages/invoice/NewInvoice.vue";
import EditInvoice from "./pages/invoice/EditInvoice.vue";
import SettingsInvoice from "./pages/invoice/SettingsInvoice.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "dashboard",
    component: Dashboard,
    meta: {
      title: "Your Dashboard",
    },
  },
  {
    path: "/account",
    name: "account",
    component: AccountPage,
    meta: {
      title: "Your Account",
    },
  },
  {
    path: "/customer",
    name: "customer",
    component: ListCustomer,
    meta: {
      title: "Manage your customers",
    },
  },
  {
    path: "/customer/new",
    name: "customer/new",
    component: NewCustomer,
    meta: {
      title: "Create a new customer",
    },
  },
  {
    path: "/customer/edit/:id",
    name: "customer/edit",
    component: EditCustomer,
    props: true,
    meta: {
      title: "Edit a customer",
    },
  },
  {
    path: "/invoice",
    name: "invoice",
    component: ListInvoice,
    meta: {
      title: "View all invoices",
    },
  },
  {
    path: "/invoice/new",
    name: "invoice/new",
    component: NewInvoice,
    meta: {
      title: "Create a new invoice",
    },
  },
  {
    path: "/invoice/edit:id",
    name: "invoice/edit",
    component: EditInvoice,
    meta: {
      title: "Edit an invoice",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
