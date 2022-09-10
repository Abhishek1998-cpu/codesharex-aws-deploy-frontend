import Vue from "vue";
import App from "./App.vue";
import VueRotuer from "vue-router";
import router from "./router";
import SocketIO from "socket.io-client";
import VueSocketIO from "vue-socket.io";

Vue.use(VueRotuer);
Vue.use(
  new VueSocketIO({
    debug: true,
    connection: SocketIO(
      "http://ec2-3-93-242-64.compute-1.amazonaws.com:5000/"
    ),
  })
);

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
