<template>
  <div>
    <codemirror
      :value="content"
      :options="cmOptions"
      @changes="onChange"
      style="text-align: left !important"
    >
    </codemirror>
  </div>
</template>

<script>
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import { codemirror } from "vue-codemirror";
import ACTIONS from "../Actions";

export default {
  name: "EditorComponent",
  props: {
    socket: Object,
    roomId: String,
  },
  components: {
    codemirror,
  },
  data() {
    return {
      content: "Enter your code here!",
      cmOptions: {
        mode: {
          name: "javascript",
          json: true,
        },
        connect: "align",
        theme: "dracula",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      },
    };
  },
  methods: {
    async init() {
      this.socket.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        console.log("It should be working", code);
        if (code !== null) {
          this.content = code;
        }
      });
    },
    async onChange(instance, changes) {
      console.log(instance);
      console.log(changes);
      const { origin } = changes[0];
      const code = instance.getValue();
      this.$emit("onCodeChange", code);
      if (origin !== "setValue") {
        console.log("Working", code);
        this.socket.emit(ACTIONS.CODE_CHANGE, {
          roomId: this.roomId,
          code,
        });
      }
    },
  },
  mounted() {
    this.init();
  },
  unmounted() {
    this.socket.off(ACTIONS.CODE_CHANGE);
  },
};
</script>

