import { createApp } from "vue";
import App from "./App.vue";
import { Quasar, Notify } from "quasar";
import router from "./routes";

import "./style.css";

import "./demos/ipc";

// Import icon libraries
import "@quasar/extras/material-icons/material-icons.css";

// Import Quasar css
import "quasar/src/css/index.sass";

// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const app = createApp(App);

app.use(Quasar, {
  plugins: {
    Notify,
  },
});
app.use(router);

app.mount("#app").$nextTick(() => {
  postMessage({ payload: "removeLoading" }, "*");
});
