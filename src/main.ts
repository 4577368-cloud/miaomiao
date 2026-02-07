import { createSSRApp } from "vue";
import { createPinia } from 'pinia';
import App from "./App.vue";

// #ifdef H5
// @ts-ignore
window._AMapSecurityConfig = {
  securityJsCode: 'c33f0278b2ea9468634718e96a945ab9',
}
// #endif

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  return {
    app,
    pinia
  };
}
