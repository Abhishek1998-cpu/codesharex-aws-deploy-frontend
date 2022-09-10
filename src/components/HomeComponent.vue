<template>
  <div class="global-wrapper">
    <div class="top-spacing">
      <h1 class="bold">{{ en.Home.welcomeMsg }}</h1>
      <h3 class="bold-top-spacing">
        {{ en.Home.onlineLiveCodeEditor }}
      </h3>
      <div class="main-wrapper">
        <input
          type="text"
          class="inputField"
          v-model="roomId"
          placeholder="Enter Room Id"
          v-on:keyup.enter="handleEnterPress"
        />
        <input
          type="text"
          class="inputField"
          v-model="userName"
          placeholder="Enter Username"
          v-on:keyup.enter="handleEnterPress"
        />
        <div class="button-section">
          <button v-on:click="onSubmit">Join</button>
          <button v-on:click="createNewRoom">New Room</button>
        </div>
      </div>
      <div class="joining-info-section">
        <div>
          <h3 class="join-info-1">&#9733; {{ en.Home.joinInfo1 }}</h3>
          <h3 class="join-info-2">&#9733; {{ en.Home.joinInfo2 }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import { v4 as uuidv4 } from "uuid";
import VueToast from "vue-toast-notification";
import "vue-toast-notification/dist/theme-sugar.css";
import en from "../constants/translation.js";

Vue.use(VueToast);
export default {
  name: "HomeComponent",
  props: {
    msg: String,
  },
  mixins: [en],
  data() {
    return {
      roomId: "",
      userName: "",
    };
  },
  methods: {
    onSubmit() {
      if (this.checkForNumber(this.userName)) {
        Vue.$toast.open({
          message: "Please do not provide number's in Name",
          type: "error",
        });
        return;
      }
      if (!this.roomId || !this.userName) {
        Vue.$toast.open({
          message: "Please fill all the details before submitting",
          type: "error",
        });
      } else {
        this.$router.push({
          name: "EditorPage",
          params: { roomId: this.roomId, userName: this.userName },
        });
      }
    },
    checkForNumber(str) {
      return /\d/.test(str);
    },
    genNewUuid() {
      const id = uuidv4();
      return id;
    },
    createNewRoom() {
      const id = this.genNewUuid();
      this.roomId = id;
      Vue.$toast.open("New room created!");
    },
    handleEnterPress: function () {
      this.onSubmit();
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,200;0,400;0,700;1,100;1,500&display=swap");

* {
  font-family: "Poppins", sans-serif;
  /* background-color: #ffa8b6; */
}
.main-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.inputField {
  padding: 0.5rem;
  margin: 0.2rem;
  min-width: 25%;
}

.global-wrapper {
  height: 98vh;
  display: flex;
  flex-direction: column;
}

.button-section {
  display: flex;
  flex-direction: row;
  margin: 1rem;
}

.join-info-1 {
  font-weight: 400;
  text-align: left;
}

.top-spacing {
  margin-top: 5rem;
}

.bold {
  font-weight: 400;
}

.bold-top-spacing {
  margin-top: -1rem;
  font-weight: 400;
}

.join-info-2 {
  font-weight: 400;
  text-align: left;
  margin-top: -1rem;
}

.joining-info-section {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 2rem;
}

button {
  background-color: lightblue;
  padding: 0.5rem;
  border-radius: 5px;
  border: none;
  min-width: 5rem;
  margin: 0.5rem;
}

button:hover {
  background-color: red;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

a {
  cursor: pointer;
}

a:hover {
  color: red;
}
</style>
