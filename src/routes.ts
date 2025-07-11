import type {} from "vue";
import {
  createRouter,
  createWebHashHistory,
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
import ListProjects from "./pages/projects/ListProjects.vue";
import EditProject from "./pages/projects/EditProject.vue";
import NewProject from "./pages/projects/NewProject.vue";
import KanbanBoard from "./pages/projects/KanbanBoard.vue";
import TimeSheet from "./pages/reports/TimeSheet.vue";
import Analytics from "./pages/analytics/Analytics.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "dashboard",
    component: Dashboard,
    meta: {
      title: "Dashboard",
    },
  },
  {
    path: "/account",
    name: "account",
    component: AccountPage,
    meta: {
      title: "Account",
    },
  },
  {
    path: "/customers",
    name: "customer",
    component: ListCustomer,
    meta: {
      title: "Customers",
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
      title: "Invoices",
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
    component: ListProjects,
    meta: {
      title: "Projects",
    },
  },
  {
    path: "/projects/new",
    name: "projects/new",
    component: NewProject,
    meta: {
      title: "Create a new Project",
    },
  },
  {
    path: "/projects/edit/:id",
    name: "projects/edit",
    component: EditProject,
    props: true,
    meta: {
      title: "Edit Project",
    },
  },
  {
    path: "/projects/kanban/:id",
    name: "projects/kanban",
    component: KanbanBoard,
    props: true,
    meta: {
      title: "Project kanban board",
    },
  },
  {
    path: "/offers",
    name: "offers",
    component: Dashboard,
    meta: {
      title: "Offers",
    },
  },
  {
    path: "/analytics",
    name: "analytics",
    component: Analytics,
    meta: {
      title: "Analytics",
    },
  },
  {
    path: "/reports/time-sheet",
    name: "reports/time-sheet",
    component: TimeSheet,
    meta: {
      title: "Time sheet Report",
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
