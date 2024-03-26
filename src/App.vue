<template>
  <router-view :key="route.path"></router-view>
</template>

<script>
import { useRoute } from 'vue-router'
export default {
  name: 'App',
  components: {},
  setup () {
    const route = useRoute()
    return {
      route
    }
  }
}
</script>

<style>
body {
  margin: 0;
}
img {
  -webkit-user-drag: none;
}
</style>
