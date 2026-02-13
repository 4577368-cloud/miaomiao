<template>
  <div class="app-container">
    <div class="global-toolbar">
      <div class="title">Admin</div>
      <div class="spacer"></div>
      <button class="btn" @click="refreshAll">拉取云端数据</button>
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

onMounted(async () => {
  await userStore.checkUser()
})

const refreshAll = () => {
  window.dispatchEvent(new CustomEvent('admin-refresh-all'))
}
</script>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.global-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 1000;
}
.title {
  font-weight: 600;
}
.spacer {
  flex: 1;
}
.btn {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.btn:hover {
  background: #f7f7f7;
}
/* Ensure date picker is above dialog mask/content */
.high-z-index-popper {
  z-index: 9999 !important;
}
</style>
