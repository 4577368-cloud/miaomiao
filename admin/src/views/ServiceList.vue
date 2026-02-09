<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增服务</el-button>
    </div>
    
    <el-table :data="services" border style="width: 100%" v-loading="loading">
      <el-table-column prop="code" label="服务代码" width="120" />
      <el-table-column prop="name" label="服务名称" width="150" />
      <el-table-column prop="base_price" label="标准价格" width="120">
        <template #default="scope">
          ¥{{ scope.row.base_price }}
        </template>
      </el-table-column>
      <el-table-column prop="discount_percent" label="折扣(%)" width="110">
        <template #default="scope">
          {{ scope.row.discount_percent ?? 100 }}
        </template>
      </el-table-column>
      <el-table-column prop="duration_minutes" label="时长(分钟)" width="110" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">
            {{ scope.row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="section-header">
      <div class="section-title">价格规则配置</div>
      <el-button type="primary" :icon="Plus" @click="handleAddPricing">新增规则</el-button>
    </div>

    <el-table :data="pricingConfigs" border style="width: 100%" v-loading="pricingLoading">
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="key" label="键值" width="140" />
      <el-table-column label="类型" width="120">
        <template #default="scope">
          <el-tag>{{ scope.row.type === 'MULTIPLIER' ? '倍率' : '固定加价' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="值" width="120">
        <template #default="scope">
          <span v-if="scope.row.type === 'MULTIPLIER'">x{{ scope.row.value }}</span>
          <span v-else>+¥{{ scope.row.value }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEditPricing(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDeletePricing(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑服务' : '新增服务'" class="admin-dialog">
      <el-form :model="form" label-width="100px">
        <el-form-item label="服务代码">
          <el-input v-model="form.code" :disabled="isEdit" placeholder="如: FEEDING" />
        </el-form-item>
        <el-form-item label="服务名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="标准价格">
          <el-input-number v-model="form.base_price" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="折扣(%)">
          <el-input-number v-model="form.discount_percent" :precision="0" :step="1" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="默认时长">
          <el-input-number v-model="form.duration_minutes" :step="5" :min="10" />
        </el-form-item>
        <el-form-item label="服务描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="pricingDialogVisible" :title="isPricingEdit ? '编辑规则' : '新增规则'" class="admin-dialog">
      <el-form :model="pricingForm" label-width="100px">
        <el-form-item label="分类">
          <el-select v-model="pricingForm.category" placeholder="选择分类">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="键值">
          <el-input v-model="pricingForm.key" placeholder="如: SMALL / DEFAULT / PLAY_15_MIN" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="pricingForm.type">
            <el-radio label="MULTIPLIER">倍率</el-radio>
            <el-radio label="FIXED_ADDITION">固定加价</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="值">
          <el-input-number v-model="pricingForm.value" :precision="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="pricingForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pricingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePricingSubmit">确定</el-button>
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

interface Service {
  id?: string
  code: string
  name: string
  base_price: number
  discount_percent?: number
  duration_minutes: number
  description: string
  is_active: boolean
}

interface PricingConfig {
  id?: string
  category: string
  key: string
  value: number
  type: 'MULTIPLIER' | 'FIXED_ADDITION'
  description: string
}

const services = ref<Service[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Service>({
  code: '',
  name: '',
  base_price: 0,
  discount_percent: 100,
  duration_minutes: 30,
  description: '',
  is_active: true
})

const pricingConfigs = ref<PricingConfig[]>([])
const pricingLoading = ref(false)
const pricingDialogVisible = ref(false)
const isPricingEdit = ref(false)
const pricingForm = ref<PricingConfig>({
  category: 'PET_SIZE',
  key: '',
  value: 1,
  type: 'MULTIPLIER',
  description: ''
})
const categoryOptions = ['PET_SIZE', 'HOLIDAY', 'RUSH', 'ADD_ON', 'MULTI_PET']

const fetchServices = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('service_types')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    ElMessage.error('加载失败: ' + error.message)
  } else {
    services.value = data || []
  }
  loading.value = false
}

const fetchPricingConfigs = async () => {
  pricingLoading.value = true
  const { data, error } = await supabase
    .from('pricing_configs')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true })
  
  if (error) {
    ElMessage.error('加载失败: ' + error.message)
  } else {
    pricingConfigs.value = data || []
  }
  pricingLoading.value = false
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { code: '', name: '', base_price: 0, discount_percent: 100, duration_minutes: 30, description: '', is_active: true }
  dialogVisible.value = true
}

const handleEdit = (row: Service) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: Service) => {
  ElMessageBox.confirm('确定删除该服务吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    const { error } = await supabase.from('service_types').delete().eq('id', row.id)
    if (error) ElMessage.error('删除失败')
    else {
      ElMessage.success('删除成功')
      fetchServices()
    }
  })
}

const handleAddPricing = () => {
  isPricingEdit.value = false
  pricingForm.value = {
    category: 'PET_SIZE',
    key: '',
    value: 1,
    type: 'MULTIPLIER',
    description: ''
  }
  pricingDialogVisible.value = true
}

const handleEditPricing = (row: PricingConfig) => {
  isPricingEdit.value = true
  pricingForm.value = { ...row }
  pricingDialogVisible.value = true
}

const handleDeletePricing = (row: PricingConfig) => {
  ElMessageBox.confirm('确定删除该规则吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    const { error } = await supabase.from('pricing_configs').delete().eq('id', row.id)
    if (error) ElMessage.error('删除失败')
    else {
      ElMessage.success('删除成功')
      fetchPricingConfigs()
    }
  })
}

const handleSubmit = async () => {
  if (isEdit.value) {
    const { error } = await supabase
      .from('service_types')
      .update(form.value)
      .eq('id', form.value.id)
    
    if (error) ElMessage.error('更新失败')
    else {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      fetchServices()
    }
  } else {
    const { error } = await supabase
      .from('service_types')
      .insert(form.value)
    
    if (error) ElMessage.error('创建失败: ' + error.message)
    else {
      ElMessage.success('创建成功')
      dialogVisible.value = false
      fetchServices()
    }
  }
}

const handlePricingSubmit = async () => {
  if (isPricingEdit.value) {
    const { error } = await supabase
      .from('pricing_configs')
      .update(pricingForm.value)
      .eq('id', pricingForm.value.id)
    
    if (error) ElMessage.error('更新失败')
    else {
      ElMessage.success('更新成功')
      pricingDialogVisible.value = false
      fetchPricingConfigs()
    }
  } else {
    const { error } = await supabase
      .from('pricing_configs')
      .insert(pricingForm.value)
    
    if (error) ElMessage.error('创建失败: ' + error.message)
    else {
      ElMessage.success('创建成功')
      pricingDialogVisible.value = false
      fetchPricingConfigs()
    }
  }
}

onMounted(() => {
  fetchServices()
  fetchPricingConfigs()
})
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
.section-header {
  margin: 24px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* Dialog body scroll fix */
:deep(.admin-dialog .el-dialog__body) {
  max-height: 70vh;
  overflow: auto;
}
</style>
