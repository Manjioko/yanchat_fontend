<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
  <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
  <cmain />
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
import cmain from './components/mainUi.vue'

export default {
  name: 'App',
  components: {
    // HelloWorld
    cmain
  }
}
</script>

<style>
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
} */
body {
  margin: 0;
}
</style>
