
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null)
  const router = useRouter()

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      user.value = data.user
    } else {
      // MOCK ADMIN USER FOR TESTING
      user.value = {
        id: 'mock-admin-id',
        email: 'admin@example.com',
        role: 'authenticated',
        app_metadata: { provider: 'email' },
        user_metadata: { role: 'admin' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
    }
  }

  async function login(email: string, password: string) {
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
