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
import Settings from "./pages/system/Settings.vue";

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
    path: "/customers",
    name: "customer",
    component: ListCustomer,
    meta: {
      title: "Manage your customers",
    },
  },
  {
    path: "/customers/new",
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
      title: "Edit customer",
    },
  },
  {
    path: "/invoices",
    name: "invoices",
    component: ListInvoice,
    meta: {
      title: "View all invoices",
    },
  },
  {
    path: "/invoices/new",
    name: "invoices/new",
    component: NewInvoice,
    meta: {
      title: "Create a new invoice",
    },
  },
  {
    path: "/invoices/edit/:id",
    name: "invoices/edit",
    component: EditInvoice,
    props: true,
    meta: {
      title: "Edit invoice",
    },
  },
  {
    path: "/settings",
    name: "settings",
    component: Settings,
    meta: {
      title: "Settings",
    },
  },
  {
    path: "/projects",
    name: "projects",
    component: Dashboard,
    meta: {
      title: "Your projects",
    },
  },
  {
    path: "/offers",
    name: "offers",
    component: Dashboard,
    meta: {
      title: "Your offers",
    },
  },
  {
    path: "/analytics",
    name: "analytics",
    component: Dashboard,
    meta: {
      title: "Analytics",
    },
  },
  {
    path: "/work-logs",
    name: "work-logs",
    component: Dashboard,
    meta: {
      title: "Your work-logs",
    },
  },
  {
    path: "/reports",
    name: "reports",
    component: Dashboard,
    meta: {
      title: "Your reports",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
