<template>
  <div class="main-wrapper">
    <div class="aside">
      <div class="aside-inner">
        <div class="logo">
          <img
            class="logo-image"
            src="../assets/codesharex.png"
            alt="codesharexIcon"
          />
        </div>
        <h3>{{ en.EditorPage.userConnected }}</h3>
        <div class="clients-list">
          <div v-for="client in clients" :key="client.socketId">
            <ClientComponent :userName="client.userName" />
          </div>
        </div>
      </div>
      <p class="show-room-id">{{ this.roomId }}</p>
      <button class="copy-button" v-on:click="copyRoomId">{{en.EditorPage.copyRoomId}}</button>
      <!-- For creating divider  -->
      <div class="logo"></div>
      <button class="leave-button" v-on:click="leaveRoom">{{en.EditorPage.leaveRoom}}</button>
    </div>
    <div class="editor-wrapper">
      <EditorComponent
        v-bind:socket="socket"
        v-bind:roomId="roomId"
        @onCodeChange="syncOnCodeChange"
      />
      <div>
        <div class="options-wrapper">
          <div class="select-language-dropdown">
            <h3 class="font-bold">{{en.EditorPage.selectLanguage}} &nbsp;</h3>
            <select v-model="language">
              <option value="c">{{ en.EditorPage.languageOption1 }}</option>
              <option value="cpp">{{ en.EditorPage.languageOption2 }}</option>
              <option value="js">{{ en.EditorPage.languageOption3 }}</option>
              <option value="py">{{ en.EditorPage.languageOption4 }}</option>
              <option value="java">{{ en.EditorPage.languageOption5 }}</option>
            </select>
          </div>
          <div>
            <button v-on:click="executeCode">{{ en.EditorPage.run }}</button>
            <button v-on:click="clearOutput">{{ en.EditorPage.clearOutput }}</button>
          </div>
        </div>
        <div class="output-section">
          <div>
            <h3 class="font-bold-left">{{ en.EditorPage.output }}</h3>
          </div>
          <div class="loader-output-wrapper">
            <div
              class="semipolar-spinner"
              v-if="this.status === 'pending'"
            >
              <div class="ring"></div>
              <div class="ring"></div>
              <div class="ring"></div>
              <div class="ring"></div>
              <div class="ring"></div>
            </div>
            <span>
              <h4 v-if="showOutput">{{ output }}</h4>
            </span>
          </div>
        </div>
        <div class="show-more-output-section">
          <div>
            <button
              v-if="showOutput"
              v-on:click="renderMoreDetails"
              style="margin: 0rem" 
            >
              {{ showMoreDetails ?  en.EditorPage.hideMoreDetails  : en.EditorPage.showMoreDetails }}
            </button>
          </div>
          <div v-if="showMoreDetails && showOutput">
            <h4 class="display-status">Status: {{ this.status }}</h4>
            <p class="job-id">
              {{ this.jobId && `JobId: ${this.jobId}` }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import VueToast from "vue-toast-notification";
import "vue-toast-notification/dist/theme-sugar.css";
import ClientComponent from "./ClientComponent";
import EditorComponent from "./EditorComponent";
import axios from "axios";
import io from "socket.io-client";
import ACTIONS from "../Actions";
import en from "../constants/translation.js";

Vue.use(VueToast);

export default {
  name: "EditorPageComponent",
  props: {
    userName: String,
    roomId: String,
  },
  mixins: [en],
  components: {
    ClientComponent,
    EditorComponent,
  },
  data() {
    return {
      clients: [],
      socket: io("http://ec2-3-93-242-64.compute-1.amazonaws.com:5000/"),
      codeRef: "",
      showOutput: false,
      output: "",
      language: "cpp",
      status: "",
      jobId: "",
      showMoreDetails: false,
    };
  },
  methods: {
    handleErrors(err) {
      console.log("Socket error", err);
      Vue.$toast.open({
        message: "Socket connection failed, Please try again",
        type: "error",
      });
      this.$router.push({
        name: "Home",
      });
    },
    async init() {
      this.socket.on("connect_error", (err) => this.handleErrors(err));
      this.socket.on("connect_failed", (err) => this.handleErrors(err));
      this.socket.emit(ACTIONS.JOIN, {
        roomId: this.roomId,
        userName: this.userName,
      });
      this.socket.on(ACTIONS.JOINED, ({ clients, userName, socketId }) => {
        if (userName !== this.userName) {
          Vue.$toast.open({
            message: `${userName} joined the room.`,
          });
        }
        this.clients = clients;
        if (this.codeRef !== "") {
          this.socket.emit(ACTIONS.SYNC_CODE, {
            code: this.codeRef,
            socketId: socketId,
          });
        }
      });
      this.socket.on(ACTIONS.DISCONNECTED, ({ socketId, userName }) => {
        Vue.$toast.open({
          message: `${userName} left the room.`,
        });
        this.clients = this.clients.filter(
          (client) => client.socketId !== socketId
        );
      });
    },
    async copyRoomId() {
      try {
        await navigator.clipboard.writeText(this.roomId);
        Vue.$toast.open({
          message: `Room Id has been copied`,
        });
      } catch (error) {
        Vue.$toast.open({
          message: "Could not copy Room Id",
          type: "error",
        });
        console.log(error);
      }
    },
    leaveRoom() {
      this.socket.off(ACTIONS.JOINED);
      this.socket.off(ACTIONS.DISCONNECTED);
      this.socket.disconnect();
      this.$router.push({
        name: "Home",
      });
    },
    syncOnCodeChange(value) {
      this.codeRef = value;
    },
    async executeCode() {
      const payload = {
        language: this.language,
        code: this.codeRef,
      };
      try {
        this.jobId = "";
        this.status = "pending";
        this.output = "";
        this.showOuput = false;
        this.showMoreDetails = false;
        const { data } = await axios.post("http://ec2-3-93-242-64.compute-1.amazonaws.com:5000/run", payload);
        this.jobId = data.jobId;
        let intervalId;

        // Polling Implementation
        intervalId = setInterval(async () => {
          const { data: dataRes } = await axios.get(
            "http://ec2-3-93-242-64.compute-1.amazonaws.com:5000/status",
            { params: { id: data.jobId } }
          );
          const { success, job, error } = dataRes;
          if (success) {
            const { status: jobStatus, output: jobOutput } = job;
            this.status = jobStatus;
            if (this.status === "pending") {
              return;
            }
            this.output = jobOutput;
            clearInterval(intervalId);
          } else {
            console.log(error);
            this.status = "Error: Please retry!";
            clearInterval(intervalId);
            this.output = error;
          }
        }, 1000);
      } catch ({ response }) {
        if (response) {
          console.log(response);
          const errMsg = response.data.err.stderr;
          this.output = errMsg;
          console.log(response);
        } else {
          Vue.$toast.open({
            message: "Error connecting to server",
            type: "error",
          });
        }
      }
      this.showOutput = true;
    },
    clearOutput() {
      this.status = "";
      this.output = "";
      this.showOutput = false;
    },
    renderMoreDetails() {
      this.showMoreDetails = !this.showMoreDetails;
    },
  },
  mounted() {
    this.init();
  },
  unmounted() {
    this.socket.off(ACTIONS.JOINED);
    this.socket.off(ACTIONS.DISCONNECTED);
    this.socket.disconnect();
  },
  sockets: {
    connect: function () {
      console.log("Socket Connected");
    },
    disconnect: function () {
      console.log("Socket Disconnected");
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,200;0,400;0,700;1,100;1,500&display=swap");

* {
  font-family: "Poppins", sans-serif;
}
.main-wrapper {
  display: grid;
  height: 100vh;
  grid-template-columns: 230px 1fr;
}

select {
  cursor:pointer
}
.aside {
  display: flex;
  flex-direction: column;
  background: #1c1e29;
  padding: 16px;
  color: #fff;
}
.aside-inner {
  flex: 1;
}

.show-room-id {
  font-size: 12px;
}
.clients-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.logo {
  border-bottom: 1px solid #424242;
  padding-bottom: 10px;
}

.options-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.font-bold {
  font-weight: 400;
}

.font-bold-left {
  font-weight: 400;
  text-align: left;
}

.select-language-dropdown {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.loader-output-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.job-id {
  text-align: left;
  font-weight: 400;
  font-style: italic;
  margin-top: -1rem;
  font-size: 14px;
}

.show-more-output-section {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
}

.output-section {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 1rem;
  padding-right: 1rem;
  padding-left: 1rem;
}

.display-status {
  text-align: left;
  font-weight: 400;
  font-style: italic;
  font-size: 14px;
}
.logo-image {
  height: 6rem;
  width: 9rem;
  object-fit: cover;
}

button {
  background-color: lightblue;
  padding: 0.5rem;
  border-radius: 5px;
  border: 2px solid black;
  min-width: 5rem;
  margin: 0.5rem;
  cursor: pointer;
}

button:hover {
  background-color: red;
  color: white;
  cursor: pointer
}

select {
  height: 2rem;
}

.semipolar-spinner,
.semipolar-spinner * {
  box-sizing: border-box;
}

.semipolar-spinner {
  height: 35px;
  width: 35px;
  position: relative;
}

.semipolar-spinner .ring {
  border-radius: 50%;
  position: absolute;
  border: calc(35px * 0.05) solid transparent;
  border-top-color: red;
  border-left-color: red;
  animation: semipolar-spinner-animation 2s infinite;
}

.semipolar-spinner .ring:nth-child(1) {
  height: calc(35px - 35px * 0.2 * 0);
  width: calc(35px - 35px * 0.2 * 0);
  top: calc(35px * 0.1 * 0);
  left: calc(35px * 0.1 * 0);
  animation-delay: calc(2000ms * 0.1 * 4);
  z-index: 5;
}

.semipolar-spinner .ring:nth-child(2) {
  height: calc(35px - 35px * 0.2 * 1);
  width: calc(35px - 35px * 0.2 * 1);
  top: calc(35px * 0.1 * 1);
  left: calc(35px * 0.1 * 1);
  animation-delay: calc(2000ms * 0.1 * 3);
  z-index: 4;
}

.semipolar-spinner .ring:nth-child(3) {
  height: calc(35px - 35px * 0.2 * 2);
  width: calc(35px - 35px * 0.2 * 2);
  top: calc(35px * 0.1 * 2);
  left: calc(35px * 0.1 * 2);
  animation-delay: calc(2000ms * 0.1 * 2);
  z-index: 3;
}

.semipolar-spinner .ring:nth-child(4) {
  height: calc(35px - 35px * 0.2 * 3);
  width: calc(35px - 35px * 0.2 * 3);
  top: calc(35px * 0.1 * 3);
  left: calc(35px * 0.1 * 3);
  animation-delay: calc(2000ms * 0.1 * 1);
  z-index: 2;
}

.semipolar-spinner .ring:nth-child(5) {
  height: calc(35px - 35px * 0.2 * 4);
  width: calc(35px - 35px * 0.2 * 4);
  top: calc(35px * 0.1 * 4);
  left: calc(35px * 0.1 * 4);
  animation-delay: calc(2000ms * 0.1 * 0);
  z-index: 1;
}

@keyframes semipolar-spinner-animation {
  50% {
    transform: rotate(360deg) scale(0.7);
  }
}
</style>
