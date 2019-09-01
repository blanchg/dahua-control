// App.vue

<template>
<div>
  <div class="aaa">
      <div class="container">
        <router-link v-for="camera in cameras" :key="camera.key" :to="`/${camera.key}`">
          {{ camera.name }}
        </router-link>
      </div>
  </div>
  <router-view></router-view>
</div>
</template>

<script lang="ts">
import Vue from "vue";


export default {
  data() {
    return {
      cameras: [],
      isLoading: true,
      isError: false
    };
  },
  async mounted () {
    try {
      this.isError = false;
      this.isLoading = true;
      let res = await fetch('/api/cameras')
      this.cameras = await res.json();
      console.log(this.cameras);

    } catch (e) {
      this.isError = true;
    } finally {
      this.isLoading = false;
    }
    // fetch()
    //   .get('https://api.coindesk.com/v1/bpi/currentprice.json')
    //   .then(response => {
    //     this.info = response.data.bpi
    //   })
    //   .catch(error => {
    //     console.log(error)
    //     this.errored = true
    //   })
    //   .finally(() => this.loading = false)
  }
};
</script>

<style lang="scss" scoped>
.container {
  margin-top: 10px;
  padding-left: 10px;
  flex: 0 0 auto;
}
.container a {
  display: inline-block;
  padding: 15px;
  margin-right: 2px;
  border-radius: 5px 5px 0 0;
  border: 0px solid #334;
  border-width: 1px 1px 0 1px;
  border-collapse: collapse;
  background: #334;
  color: #bbb;
  text-decoration: none;
}
.container a.router-link-active {
  background: #223;
  border-color: #223;
}
</style>