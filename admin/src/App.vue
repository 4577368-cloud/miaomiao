<template>
  <div v-if="!loggedIn" class="login-page">
    <div class="login-card">
      <div class="login-title">管理员登录</div>
      <el-form @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="remember">记住密码</el-checkbox>
        </el-form-item>
        <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">登录</el-button>
      </el-form>
    </div>
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { supabase } from './utils/supabase'

const username = ref('admin')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const loggedIn = ref(false)
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@miaomiao.com'

const loadRemember = () => {
  const rememberFlag = localStorage.getItem('admin_remember') === '1'
  remember.value = rememberFlag
  if (rememberFlag) {
    username.value = localStorage.getItem('admin_username') || 'admin'
    password.value = localStorage.getItem('admin_password') || ''
  }
}

const checkSession = async () => {
  const stored = localStorage.getItem('admin_session') === '1'
  if (!stored) return
  const { data } = await supabase.auth.getSession()
  loggedIn.value = !!data.session
}

const handleLogin = async () => {
  if (username.value !== 'admin' || password.value !== '111111') {
    ElMessage.error('账号或密码错误')
    return
  }
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: password.value
  })
  loading.value = false
  if (error) {
    ElMessage.error('Supabase 登录失败，请确认已创建 admin 账号')
    return
  }
  loggedIn.value = true
  localStorage.setItem('admin_session', '1')
  if (remember.value) {
    localStorage.setItem('admin_username', username.value)
    localStorage.setItem('admin_password', password.value)
    localStorage.setItem('admin_remember', '1')
  } else {
    localStorage.removeItem('admin_username')
    localStorage.removeItem('admin_password')
    localStorage.setItem('admin_remember', '0')
  }
}

onMounted(() => {
  loadRemember()
  void checkSession()
})
</script>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.login-card {
  width: 360px;
  background: #fff;
  padding: 32px 28px;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}
.login-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}
</style>
