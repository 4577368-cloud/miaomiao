
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const router = useRouter()

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    user.value = data.user
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    user.value = data.user
    return data.user
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    // We will handle redirect in the component or router
  }

  return {
    user,
    checkUser,
    login,
    logout
  }
})
