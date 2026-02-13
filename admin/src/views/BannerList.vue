<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建轮播</el-button>
      <el-button @click="fetchList" :loading="loading">刷新</el-button>
    </div>
    <el-table :data="banners" border style="width: 100%" v-loading="loading">
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="图片" width="220">
        <template #default="scope">
          <img :src="scope.row.image_url" class="thumb" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" width="220" />
      <el-table-column prop="action_type" label="动作" width="120" />
      <el-table-column prop="is_active" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">{{ scope.row.is_active ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="260">
        <template #default="scope">
          <div>{{ format(scope.row.start_time) }} ~ {{ format(scope.row.end_time) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="openEdit(scope.row)">编辑</el-button>
          <el-button link type="warning" size="small" @click="toggleActive(scope.row)">{{ scope.row.is_active ? '停用' : '启用' }}</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="轮播配置" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload :auto-upload="false" :on-change="handleFile" :show-file-list="false" accept="image/*">
            <el-button>选择图片</el-button>
          </el-upload>
          <div class="preview" v-if="form.image_url"><img :src="form.image_url" /></div>
          <div class="tip">建议尺寸 750x300</div>
        </el-form-item>
        <el-form-item label="图片链接">
          <el-input v-model="form.image_url" placeholder="直接粘贴网络图片地址（CDN/图床/Supabase Storage）" />
        </el-form-item>
        <el-form-item label="动作">
          <el-select v-model="form.action_type" placeholder="选择动作" style="width: 200px">
            <el-option label="无" value="none" />
            <el-option label="链接" value="link" />
            <el-option label="公告" value="announcement" />
            <el-option label="发券" value="coupon" />
          </el-select>
        </el-form-item>
        <el-form-item label="动作参数">
          <el-input v-model="actionPayloadText" placeholder='示例: {"link":"/pages/home/index"} 或 {"coupon_template_id":"..."}' />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker 
            v-model="dateRange" 
            type="datetimerange" 
            start-placeholder="开始时间" 
            end-placeholder="结束时间" 
            popper-class="high-z-index-popper"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const storageBucket = (import.meta as any).env?.VITE_STORAGE_BUCKET || 'public1'

const loading = ref(false)
const saving = ref(false)
const banners = ref<any[]>([])
const dialogVisible = ref(false)
const form = ref<any>({ id: null, title: '', image_url: '', action_type: 'none', action_payload: {}, is_active: true, sort_order: 0, start_time: null, end_time: null })
const dateRange = ref<[Date, Date] | null>(null)
const actionPayloadText = ref('')

const format = (str: string) => (str ? new Date(str).toLocaleString() : '')

const fetchList = async () => {
  loading.value = true
  const { data, error } = await supabase.rpc('admin_get_banners')
  if (error) ElMessage.error('加载失败')
  banners.value = data || []
  loading.value = false
}

const openCreate = () => {
  form.value = { id: null, title: '', image_url: '', action_type: 'none', action_payload: {}, is_active: true, sort_order: 0, start_time: null, end_time: null }
  dateRange.value = null
  actionPayloadText.value = ''
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  form.value = { ...row }
  dateRange.value = row.start_time || row.end_time ? [row.start_time ? new Date(row.start_time) : new Date(), row.end_time ? new Date(row.end_time) : new Date()] : null
  actionPayloadText.value = row.action_payload ? JSON.stringify(row.action_payload) : ''
  dialogVisible.value = true
}

const handleFile = async (file: any) => {
  try {
    const f = file.raw || file
    const name = `banners/${Date.now()}_${f.name}`
    const { error: upErr } = await supabase.storage.from(storageBucket).upload(name, f, { upsert: true })
    if (upErr) {
      ElMessage.error(`上传失败: ${upErr.message || '未知错误'}`)
      return
    }
    const { data } = supabase.storage.from(storageBucket).getPublicUrl(name)
    if (!data?.publicUrl) {
      ElMessage.warning('已上传，但未生成公开链接，请确认 bucket 可公开访问')
      return
    }
    form.value.image_url = data.publicUrl
  } catch (e: any) {
    ElMessage.error(`上传失败: ${e?.message || e}`)
  }
}

const submit = async () => {
  saving.value = true
  try {
    let payload = {}
    if (actionPayloadText.value) {
      payload = JSON.parse(actionPayloadText.value)
    }
    const start = dateRange.value ? dateRange.value[0].toISOString() : null
    const end = dateRange.value ? dateRange.value[1].toISOString() : null
    const { data, error } = await supabase.rpc('admin_upsert_banner', {
      p_id: form.value.id,
      p_title: form.value.title,
      p_image_url: form.value.image_url,
      p_action_type: form.value.action_type,
      p_action_payload: payload,
      p_is_active: form.value.is_active,
      p_sort_order: form.value.sort_order,
      p_start_time: start,
      p_end_time: end
    })
    if (error) throw error
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

const toggleActive = async (row: any) => {
  const { error } = await supabase.from('banners').update({ is_active: !row.is_active }).eq('id', row.id)
  if (error) return ElMessage.error('操作失败')
  fetchList()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该轮播？', '提示', { type: 'warning' }).then(async () => {
    const { error } = await supabase.rpc('admin_delete_banner', { p_id: row.id })
    if (error) ElMessage.error('删除失败')
    else {
      ElMessage.success('删除成功')
      fetchList()
    }
  })
}

fetchList()
</script>

<style scoped>
.page-container { padding: 20px; background: #fff; border-radius: 4px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.thumb { width: 200px; height: 80px; object-fit: cover; border: 1px solid #eee; border-radius: 6px; }
.preview img { width: 300px; height: 120px; object-fit: cover; border: 1px solid #eee; border-radius: 6px; margin-top: 8px; }
.tip { font-size: 12px; color: #999; margin-top: 6px; }
</style>
