import Vue from "vue";
import App from "./App.vue";
import VueRotuer from "vue-router";
import router from "./router";
import SocketIO from "socket.io-client";
import VueSocketIO from "vue-socket.io";
import Vuelidate from "vuelidate";

Vue.use(VueRotuer, Vuelidate);

Vue.use(
  new VueSocketIO({
    debug: true,
    connection: SocketIO(
      "http://ec2-54-159-198-233.compute-1.amazonaws.com:5000/"
    ),
  })
);

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
