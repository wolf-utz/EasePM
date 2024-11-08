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
  config: {
    brand: {
      primary: "#306844",
      secondary: "#455b55",
      accent: "#9C27B0",

      dark: "#1d1d1d",
      "dark-page": "#121212",

      positive: "#21BA45",
      negative: "#C10015",
      info: "#31CCEC",
      warning: "#F2C037",
    },
  },
});
app.use(router);

app.mount("#app").$nextTick(() => {
  postMessage({ payload: "removeLoading" }, "*");
});
