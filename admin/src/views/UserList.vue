<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
    </div>

    <el-table :data="users" border style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="用户ID" min-width="220" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="scope">
          <el-tag>{{ scope.row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" width="120">
        <template #default="scope">
          ¥{{ Number(scope.row.balance || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="labor_balance" label="劳务余额" width="120">
        <template #default="scope">
          ¥{{ Number(scope.row.labor_balance || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="180">
        <template #default="scope">
          {{ scope.row.created_at ? new Date(scope.row.created_at).toLocaleString() : '' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'">
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="form.id" :disabled="isEdit" placeholder="请输入用户UUID" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="头像">
          <el-input v-model="form.avatar" placeholder="头像链接" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="owner" value="owner" />
            <el-option label="sitter" value="sitter" />
            <el-option label="admin" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="余额">
          <el-input-number v-model="form.balance" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="劳务余额">
          <el-input-number v-model="form.labor_balance" :precision="2" :step="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { supabase } from '@/utils/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

interface UserProfile {
  id: string
  nickname: string
  avatar: string
  role: string
  balance: number
  labor_balance: number
  created_at: string
}

const users = ref<UserProfile[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<UserProfile>({
  id: '',
  nickname: '',
  avatar: '',
  role: 'owner',
  balance: 0,
  labor_balance: 0,
  created_at: ''
})

const fetchUsers = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    ElMessage.error('加载失败: ' + error.message)
  } else {
    users.value = (data || []) as UserProfile[]
  }
  loading.value = false
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: '',
    nickname: '',
    avatar: '',
    role: 'owner',
    balance: 0,
    labor_balance: 0,
    created_at: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row: UserProfile) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: UserProfile) => {
  ElMessageBox.confirm('确定删除该用户吗？', '提示', { type: 'warning' }).then(async () => {
    const { error } = await supabase.from('profiles').delete().eq('id', row.id)
    if (error) ElMessage.error('删除失败: ' + error.message)
    else {
      ElMessage.success('删除成功')
      fetchUsers()
    }
  })
}

const handleSubmit = async () => {
  if (!form.value.id) {
    ElMessage.warning('请填写用户ID')
    return
  }
  if (isEdit.value) {
    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: form.value.nickname,
        avatar: form.value.avatar,
        role: form.value.role,
        balance: form.value.balance,
        labor_balance: form.value.labor_balance,
        updated_at: new Date().toISOString()
      })
      .eq('id', form.value.id)
    
    if (error) ElMessage.error('更新失败: ' + error.message)
    else {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      fetchUsers()
    }
  } else {
    const { error } = await supabase.from('profiles').insert({
      id: form.value.id,
      nickname: form.value.nickname,
      avatar: form.value.avatar,
      role: form.value.role,
      balance: form.value.balance,
      labor_balance: form.value.labor_balance
    })
    if (error) ElMessage.error('创建失败: ' + error.message)
    else {
      ElMessage.success('创建成功')
      dialogVisible.value = false
      fetchUsers()
    }
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}
.toolbar {
  margin-bottom: 20px;
}
</style>
