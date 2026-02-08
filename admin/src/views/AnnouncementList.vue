<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增公告</el-button>
    </div>
    <el-table :data="rows" border style="width: 100%" v-loading="loading">
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="content" label="内容" min-width="320" />
      <el-table-column prop="link" label="跳转链接" min-width="220" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '新增公告'">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input type="textarea" v-model="form.content" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.link" placeholder="/pages/home/index 或 http(s)://" />
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

interface AnnouncementRow {
  id?: string
  title: string
  content: string
  link?: string
  created_at?: string
}

const rows = ref<AnnouncementRow[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<AnnouncementRow>({ title: '', content: '', link: '' })

const fetchRows = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    ElMessage.error('加载失败: ' + error.message)
  } else {
    rows.value = (data || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      link: r.link,
      created_at: r.created_at ? new Date(r.created_at).toLocaleString() : ''
    }))
  }
  loading.value = false
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { title: '', content: '', link: '' }
  dialogVisible.value = true
}

const handleEdit = (row: AnnouncementRow) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: AnnouncementRow) => {
  ElMessageBox.confirm('确定删除该公告吗？', '提示', { type: 'warning' }).then(async () => {
    if (!row.id) return
    const { error } = await supabase.from('announcements').delete().eq('id', row.id)
    if (error) {
      ElMessage.error('删除失败: ' + error.message)
      return
    }
    ElMessage.success('删除成功')
    fetchRows()
  })
}

const handleSubmit = async () => {
  if (!form.value.title) {
    ElMessage.warning('请填写标题')
    return
  }
  if (isEdit.value && form.value.id) {
    const { error } = await supabase
      .from('announcements')
      .update({
        title: form.value.title,
        content: form.value.content,
        link: form.value.link,
        created_at: new Date().toISOString()
      })
      .eq('id', form.value.id)
    if (error) {
      ElMessage.error('更新失败: ' + error.message)
    } else {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      fetchRows()
    }
  } else {
    const { error } = await supabase
      .from('announcements')
      .insert({
        title: form.value.title,
        content: form.value.content,
        link: form.value.link,
        created_at: new Date().toISOString()
      })
    if (error) {
      ElMessage.error('创建失败: ' + error.message)
    } else {
      ElMessage.success('创建成功')
      dialogVisible.value = false
      fetchRows()
    }
  }
}

onMounted(fetchRows)
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
