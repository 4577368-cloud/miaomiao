<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增宠托师</el-button>
    </div>

    <el-table :data="sitters" border style="width: 100%" v-loading="loading">
      <el-table-column prop="user_id" label="用户ID" min-width="220" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column label="头像" width="100">
        <template #default="scope">
          <el-image :src="scope.row.avatar" fit="cover" style="width:36px;height:36px;border-radius:50%" />
        </template>
      </el-table-column>
      <el-table-column prop="real_name" label="真实姓名" width="140" />
      <el-table-column prop="id_card" label="身份证号" width="180" />
      <el-table-column label="证件照(人像)" width="140">
        <template #default="scope">
          <el-image v-if="scope.row.id_card_front" :src="scope.row.id_card_front" fit="cover" style="width:64px;height:40px;border-radius:4px" :preview-src-list="[scope.row.id_card_front]" />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="证件照(国徽)" width="140">
        <template #default="scope">
          <el-image v-if="scope.row.id_card_back" :src="scope.row.id_card_back" fit="cover" style="width:64px;height:40px;border-radius:4px" :preview-src-list="[scope.row.id_card_back]" />
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="level" label="等级" width="100" />
      <el-table-column prop="experience_years" label="经验(年)" width="100" />
      <el-table-column prop="is_certified" label="认证" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_certified ? 'success' : 'info'">
            {{ scope.row.is_certified ? '已认证' : '未认证' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="certification_status" label="审核状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.certification_status === 'verified' ? 'success' : (scope.row.certification_status === 'pending' ? 'warning' : (scope.row.certification_status === 'rejected' ? 'danger' : 'info'))">
            {{ scope.row.certification_status || 'none' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="certification_reject_reason" label="拒绝原因" min-width="180" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          <el-button size="small" type="success" @click="handleApprove(scope.row)" :disabled="scope.row.certification_status === 'verified'">通过</el-button>
          <el-button size="small" type="warning" @click="handleReject(scope.row)" :disabled="scope.row.certification_status === 'rejected'">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑宠托师' : '新增宠托师'">
      <el-form :model="form" label-width="110px">
        <el-form-item label="用户ID">
          <el-input v-model="form.user_id" :disabled="isEdit" placeholder="请输入用户UUID" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="头像">
          <el-input v-model="form.avatar" placeholder="头像链接" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="form.id_card" />
        </el-form-item>
        <el-form-item label="证件照(人像)">
          <el-upload drag :show-file-list="false" :http-request="handleUploadFront" accept="image/*">
            <div class="upload-box">
              <el-image v-if="form.id_card_front" :src="form.id_card_front" fit="cover" class="upload-preview" />
              <div v-else class="upload-placeholder">拖拽或点击上传</div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="证件照(国徽)">
          <el-upload drag :show-file-list="false" :http-request="handleUploadBack" accept="image/*">
            <div class="upload-box">
              <el-image v-if="form.id_card_back" :src="form.id_card_back" fit="cover" class="upload-preview" />
              <div v-else class="upload-placeholder">拖拽或点击上传</div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="form.level" style="width: 100%">
            <el-option label="TRAINEE" value="TRAINEE" />
            <el-option label="BRONZE" value="BRONZE" />
            <el-option label="SILVER" value="SILVER" />
            <el-option label="GOLD" value="GOLD" />
            <el-option label="DIAMOND" value="DIAMOND" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="form.rating" :precision="1" :step="0.1" :min="0" :max="5" />
        </el-form-item>
        <el-form-item label="经验年限">
          <el-input-number v-model="form.experience_years" :min="0" :max="50" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tagsText" placeholder="用逗号分隔" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.bio" type="textarea" />
        </el-form-item>
        <el-form-item label="认证状态">
          <el-switch v-model="form.is_certified" />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="form.certification_status" style="width: 100%">
            <el-option label="none" value="none" />
            <el-option label="pending" value="pending" />
            <el-option label="verified" value="verified" />
            <el-option label="rejected" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="拒绝原因">
          <el-input v-model="form.certification_reject_reason" />
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
import type { UploadRequestOptions } from 'element-plus'

interface SitterRow {
  user_id: string
  real_name: string
  id_card: string
  level: string
  rating: number
  experience_years: number
  bio: string
  tags: string[]
  is_certified: boolean
  certification_status?: 'none' | 'pending' | 'verified' | 'rejected'
  certification_reject_reason?: string
  id_card_front?: string
  id_card_back?: string
  nickname: string
  avatar: string
  balance: number
  labor_balance: number
}

const sitters = ref<SitterRow[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  user_id: '',
  nickname: '',
  avatar: '',
  real_name: '',
  id_card: '',
  id_card_front: '',
  id_card_back: '',
  level: 'BRONZE',
  rating: 5,
  experience_years: 0,
  bio: '',
  tagsText: '',
  is_certified: false,
  certification_status: 'pending',
  certification_reject_reason: '',
  balance: 0,
  labor_balance: 0
})

const fetchSitters = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('sitter_profiles')
    .select('user_id, real_name, id_card, level, rating, experience_years, bio, tags, is_certified, certification_status, certification_reject_reason, id_card_front, id_card_back, profiles(id, nickname, avatar, balance, labor_balance)')
    .order('created_at', { ascending: false })
  
  if (error) {
    ElMessage.error('加载失败: ' + error.message)
  } else {
    sitters.value = (data || []).map((item: any) => ({
      user_id: item.user_id,
      real_name: item.real_name,
      id_card: item.id_card,
      level: item.level,
      rating: Number(item.rating || 0),
      experience_years: Number(item.experience_years || 0),
      bio: item.bio || '',
      tags: item.tags || [],
      is_certified: !!item.is_certified,
      certification_status: item.certification_status || 'none',
      certification_reject_reason: item.certification_reject_reason || '',
      id_card_front: item.id_card_front,
      id_card_back: item.id_card_back,
      nickname: item.profiles?.nickname || '',
      avatar: item.profiles?.avatar || '',
      balance: Number(item.profiles?.balance || 0),
      labor_balance: Number(item.profiles?.labor_balance || 0)
    }))
  }
  loading.value = false
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    user_id: '',
    nickname: '',
    avatar: '',
    real_name: '',
    id_card: '',
    id_card_front: '',
    id_card_back: '',
    level: 'BRONZE',
    rating: 5,
    experience_years: 0,
    bio: '',
    tagsText: '',
    is_certified: false,
    certification_status: 'pending',
    certification_reject_reason: '',
    balance: 0,
    labor_balance: 0
  }
  dialogVisible.value = true
}

const handleEdit = (row: SitterRow) => {
  isEdit.value = true
  form.value = {
    user_id: row.user_id,
    nickname: row.nickname,
    avatar: row.avatar,
    real_name: row.real_name,
    id_card: row.id_card,
    id_card_front: row.id_card_front || '',
    id_card_back: row.id_card_back || '',
    level: row.level,
    rating: row.rating,
    experience_years: row.experience_years,
    bio: row.bio,
    tagsText: row.tags.join(','),
    is_certified: row.is_certified,
    certification_status: row.certification_status || 'pending',
    certification_reject_reason: row.certification_reject_reason || '',
    balance: row.balance,
    labor_balance: row.labor_balance
  }
  dialogVisible.value = true
}

const handleDelete = (row: SitterRow) => {
  ElMessageBox.confirm('确定删除该宠托师吗？', '提示', { type: 'warning' }).then(async () => {
    const { error } = await supabase.from('sitter_profiles').delete().eq('user_id', row.user_id)
    if (error) {
      ElMessage.error('删除失败: ' + error.message)
      return
    }
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', row.user_id)
    ElMessage.success('删除成功')
    fetchSitters()
  })
}

const handleSubmit = async () => {
  if (!form.value.user_id) {
    ElMessage.warning('请填写用户ID')
    return
  }
  const tags = form.value.tagsText
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
  const nextStatus = form.value.is_certified ? 'verified' : (form.value.certification_status || 'pending')
  const nextCertified = nextStatus === 'verified'

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: form.value.user_id,
      nickname: form.value.nickname,
      avatar: form.value.avatar,
      role: 'sitter',
      balance: form.value.balance,
      labor_balance: form.value.labor_balance,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (profileError) {
    ElMessage.error('更新用户失败: ' + profileError.message)
    return
  }

  if (isEdit.value) {
    const { error } = await supabase
      .from('sitter_profiles')
      .update({
        real_name: form.value.real_name,
        id_card: form.value.id_card,
      id_card_front: form.value.id_card_front,
      id_card_back: form.value.id_card_back,
        level: form.value.level,
        rating: form.value.rating,
        experience_years: form.value.experience_years,
        bio: form.value.bio,
        tags,
      is_certified: nextCertified,
      certification_status: nextStatus,
      certification_reject_reason: form.value.certification_reject_reason,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', form.value.user_id)
    
    if (error) ElMessage.error('更新失败: ' + error.message)
    else {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      fetchSitters()
    }
  } else {
    const { error } = await supabase.from('sitter_profiles').insert({
      user_id: form.value.user_id,
      real_name: form.value.real_name,
      id_card: form.value.id_card,
      id_card_front: form.value.id_card_front,
      id_card_back: form.value.id_card_back,
      level: form.value.level,
      rating: form.value.rating,
      experience_years: form.value.experience_years,
      bio: form.value.bio,
      tags,
      is_certified: nextCertified,
      certification_status: nextStatus,
      certification_reject_reason: form.value.certification_reject_reason
    })
    if (error) ElMessage.error('创建失败: ' + error.message)
    else {
      ElMessage.success('创建成功')
      dialogVisible.value = false
      fetchSitters()
    }
  }
}

const uploadIdCard = async (file: File, side: 'front' | 'back') => {
  if (!form.value.user_id) {
    ElMessage.warning('请先填写用户ID')
    return
  }
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${form.value.user_id}/id_${side}_${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('evidence').upload(path, file, { upsert: true })
  if (error) {
    ElMessage.error('上传失败: ' + error.message)
    return
  }
  const { data } = supabase.storage.from('evidence').getPublicUrl(path)
  const url = data.publicUrl || ''
  if (side === 'front') form.value.id_card_front = url
  if (side === 'back') form.value.id_card_back = url
}

const handleUploadFront = async (options: UploadRequestOptions) => {
  await uploadIdCard(options.file as File, 'front')
}

const handleUploadBack = async (options: UploadRequestOptions) => {
  await uploadIdCard(options.file as File, 'back')
}

const handleApprove = async (row: SitterRow) => {
  const { error } = await supabase
    .from('sitter_profiles')
    .update({
      certification_status: 'verified',
      is_certified: true,
      certification_reviewed_at: new Date().toISOString()
    })
    .eq('user_id', row.user_id)
  if (error) {
    ElMessage.error('审核失败: ' + error.message)
    return
  }
  await supabase.from('profiles').update({ role: 'sitter' }).eq('id', row.user_id)
  await supabase.from('notifications').insert({
    id: `cert_verified_${row.user_id}_${Date.now()}`,
    user_id: row.user_id,
    type: 'system',
    title: '宠托师认证通过',
    content: '您的实名认证已通过审核，可以开始接单了',
    link: '/pages/profile/certification',
    is_read: false,
    created_at: new Date().toISOString()
  })
  ElMessage.success('已通过认证')
  fetchSitters()
}

const handleReject = async (row: SitterRow) => {
  let reason = ''
  const promptRes = await ElMessageBox.prompt('填写拒绝原因（可选）', '认证拒绝', { confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => null)
  if (!promptRes) return
  // Element Plus 返回 { value: string }
  const anyRes: any = promptRes
  reason = anyRes.value || ''
  const { error } = await supabase
    .from('sitter_profiles')
    .update({
      certification_status: 'rejected',
      is_certified: false,
      certification_reject_reason: reason,
      certification_reviewed_at: new Date().toISOString()
    })
    .eq('user_id', row.user_id)
  if (error) {
    ElMessage.error('操作失败: ' + error.message)
    return
  }
  await supabase.from('notifications').insert({
    id: `cert_rejected_${row.user_id}_${Date.now()}`,
    user_id: row.user_id,
    type: 'system',
    title: '宠托师认证未通过',
    content: reason ? `很遗憾，您的认证未通过，原因：${reason}` : '很遗憾，您的认证未通过',
    link: '/pages/profile/certification',
    is_read: false,
    created_at: new Date().toISOString()
  })
  ElMessage.success('已拒绝认证')
  fetchSitters()
}

onMounted(fetchSitters)
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
.upload-box {
  width: 160px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-preview {
  width: 160px;
  height: 100px;
  border-radius: 6px;
}
.upload-placeholder {
  color: #909399;
}
</style>
